const prisma = require("../config/db");
const { runTx } = require("../utils/tx");
const crypto = require("crypto");
const { toId, cleanText, safeImageRef } = require("../utils/security");
const { checkAchievements } = require("../utils/achievements");
const { isDbUnavailable } = require("../utils/dbFallback");

// Streaks count calendar days in the app's timezone (students are in IST;
// the server runs in UTC, which split days at 05:30 local time).
const APP_TZ = process.env.APP_TIMEZONE || "Asia/Kolkata";
const dayFmt = new Intl.DateTimeFormat("en-CA", { timeZone: APP_TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const dayKey = (d) => dayFmt.format(new Date(d)); // "YYYY-MM-DD"

/** The app-timezone calendar day of `d`, as a UTC-midnight Date (DailyActivity key). */
function dayStart(d) {
  return new Date(`${dayKey(d)}T00:00:00.000Z`);
}

function calculateStreak(recapDates) {
  if (recapDates.length === 0) return 0;
  const days = new Set(recapDates.map(dayKey));
  const step = (key, n) => {
    const t = new Date(`${key}T00:00:00.000Z`);
    t.setUTCDate(t.getUTCDate() + n);
    return t.toISOString().slice(0, 10);
  };
  let cursor = dayKey(new Date());
  if (!days.has(cursor)) cursor = step(cursor, -1);
  let streak = 0;
  while (days.has(cursor)) {
    streak++;
    cursor = step(cursor, -1);
  }
  return streak;
}

// POST /api/missions/:id/finish
// POST /api/missions/:id/finish
//
// Everything that affects Grit, streaks or history is computed here, from the
// database, never taken from the client:
//   - duration   = now − participation.workStartedAt (set at check-in)
//   - tasks done = completed rows in the mission's checklist (client count only
//                  when there is no checklist, capped)
//   - crash      = under 3 minutes, or under 50% of the target with 0 tasks
//                  (handoff §8 "Runway Crash")
//   - once only  = the participation must be Executing; it is flipped to
//                  Completed atomically, so a replay gets 409.
async function finishSession(req, res) {
  const userId = req.userId;
  const missionId = toId(req.params.id);
  const body = req.body || {};
  const reflection = body.reflection && typeof body.reflection === "object" ? body.reflection : {};
  if (!missionId) return res.status(400).json({ error: "Invalid mission." });

  const screenshot = safeImageRef(reflection.screenshot);
  if (screenshot === undefined) return res.status(400).json({ error: "Attach screenshots by uploading them." });
  let link = null;
  if (reflection.link) {
    const raw = String(reflection.link).trim().slice(0, 500);
    const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    try {
      const u = new URL(candidate);
      if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error();
      link = u.toString();
    } catch {
      return res.status(400).json({ error: "That link doesn't look like a web address." });
    }
  }
  const reflectionText = cleanText(reflection.reflectionText, 2000);
  const lessonsLearned = cleanText(reflection.lessonsLearned, 2000);
  const isPublic = reflection.isPublic !== false;

  try {
    const outcome = await runTx(async (tx) => {
      const mission = await tx.mission.findUnique({ where: { id: missionId }, include: { category: true } });
      if (!mission) throw new Error("NOT_FOUND");

      const participation = await tx.participation.findUnique({ where: { unique_user_mission: { userId, missionId } } });
      if (!participation) throw new Error("NOT_PART");
      if (participation.status !== "Executing" || !participation.workStartedAt) throw new Error("NOT_ACTIVE");

      // Claim the session atomically: a concurrent or repeated finish loses here.
      const claimed = await tx.participation.updateMany({
        where: { id: participation.id, status: "Executing" },
        data: { status: "Completed" }
      });
      if (claimed.count !== 1) throw new Error("NOT_ACTIVE");

      const now = new Date();
      const elapsedSec = Math.max(0, Math.floor((now.getTime() - participation.workStartedAt.getTime()) / 1000));
      const sessionDuration = Math.min(12 * 60, Math.max(1, Math.round(elapsedSec / 60)));

      const tasks = await tx.task.findMany({ where: { missionId }, select: { completed: true } });
      const tasksCompleted = tasks.length
        ? tasks.filter((t) => t.completed).length
        : Math.min(10, Math.max(0, Math.floor(Number(body.tasksCompleted) || 0)));

      // Target: group missions use the mission's focus duration; solo uses the
      // timer the user picked at check-in (bounded), 0 = open-ended.
      const isSolo = mission.missionType === "solo";
      const target = isSolo
        ? Math.min(240, Math.max(0, Math.floor(Number(body.targetMinutes) || 0)))
        : participation.workDuration || mission.focusDuration || 0;
      const isFailed = elapsedSec < 180 || (target > 0 && elapsedSec < target * 60 * 0.5 && tasksCompleted === 0);

      // Streak / personal bests from real history.
      const allUserRecaps = await tx.sessionRecap.findMany({
        where: { userId, recapType: "session" },
        select: { sessionDuration: true, tasksCompleted: true, streak: true, generatedAt: true }
      });
      const currentStreak = calculateStreak([...allUserRecaps.map((r) => r.generatedAt), now]);
      const maxPastDuration = allUserRecaps.reduce((m, r) => Math.max(m, r.sessionDuration), 0);
      const maxPastTasks = allUserRecaps.reduce((m, r) => Math.max(m, r.tasksCompleted), 0);
      const maxPastStreak = allUserRecaps.reduce((m, r) => Math.max(m, r.streak), 0);
      const first = allUserRecaps.length === 0;

      // Crew size and rank within this mission.
      const crew = isSolo
        ? 1
        : 1 + (await tx.participation.count({ where: { missionId, userId: { not: mission.createdBy || 0 }, status: { in: ["Accepted", "Executing", "Completed"] } } }));
      const others = await tx.sessionRecap.findMany({ where: { missionId, userId: { not: userId } }, select: { sessionDuration: true, tasksCompleted: true } });
      const rank = 1 + others.filter((r) => r.sessionDuration > sessionDuration || (r.sessionDuration === sessionDuration && r.tasksCompleted > tasksCompleted)).length;

      const user = await tx.user.findUnique({ where: { id: userId }, select: { reputationScore: true } });
      const weekAgo = now.getTime() - 7 * 86400e3;
      const monthAgo = now.getTime() - 30 * 86400e3;
      const unlockedAchievements = checkAchievements({
        totalMissions: allUserRecaps.length + 1,
        maxSessionMinutes: Math.max(maxPastDuration, sessionDuration),
        weeklyFocusMinutes: allUserRecaps.filter((r) => r.generatedAt.getTime() >= weekAgo).reduce((s, r) => s + r.sessionDuration, 0) + sessionDuration,
        monthlyFocusMinutes: allUserRecaps.filter((r) => r.generatedAt.getTime() >= monthAgo).reduce((s, r) => s + r.sessionDuration, 0) + sessionDuration,
        currentStreak,
        totalTasksCompleted: allUserRecaps.reduce((s, r) => s + r.tasksCompleted, 0) + tasksCompleted,
        rank,
        participantCount: crew,
        reputationScore: user ? user.reputationScore : 0
      });

      // Grit: crash −5; successful solo +10 (group rewards come from the vibe check).
      const gritDelta = isFailed ? -5 : isSolo ? 10 : 0;
      if (gritDelta !== 0) {
        await tx.user.update({ where: { id: userId }, data: { reputationScore: { increment: gritDelta } } });
      }

      const recap = await tx.sessionRecap.create({
        data: {
          userId,
          missionId,
          missionTitle: mission.title,
          categoryId: mission.categoryId,
          categorySnapshot: mission.category?.categoryName || "Other",
          sessionDuration,
          tasksCompleted,
          streak: currentStreak,
          missionRank: rank,
          cardVersion: 1,
          shareId: crypto.randomUUID(),
          achievements: unlockedAchievements,
          participantCount: crew,
          recapType: "session",
          reflectionText,
          lessonsLearned,
          isPublic,
          metadata: {
            isNewLongestSession: first || sessionDuration > maxPastDuration,
            isNewMostTasks: first || tasksCompleted > maxPastTasks,
            isNewLongestStreak: first || currentStreak > maxPastStreak,
            screenshot: screenshot || null,
            link,
            isFailed,
            gritDelta
          }
        }
      });

      const day = dayStart(now);
      await tx.dailyActivity.upsert({
        where: { userId_date: { userId, date: day } },
        update: {
          missionsCompleted: { increment: isFailed ? 0 : 1 },
          focusMinutes: { increment: sessionDuration },
          tasksCompleted: { increment: tasksCompleted },
          auraEarned: { increment: gritDelta }
        },
        create: { userId, date: day, missionsCompleted: isFailed ? 0 : 1, focusMinutes: sessionDuration, tasksCompleted, auraEarned: gritDelta }
      });

      if (isPublic) {
        const title = isFailed ? `Crashed: ${mission.title}` : `Completed: ${mission.title}`;
        await tx.feedItem.create({
          data: {
            userId,
            type: "mission_completed",
            title: title.slice(0, 200),
            description: reflectionText,
            metadata: { sessionDuration, tasksCompleted, category: mission.category?.categoryName || "Other", missionType: mission.missionType, participantCount: crew, screenshot: screenshot || null, link, isFailed },
            recapId: recap.id
          }
        });
        await tx.post.create({
          data: {
            userId,
            recapId: recap.id,
            imageUrl: screenshot ? JSON.stringify([screenshot]) : null,
            caption: (reflectionText || title).slice(0, 300),
            visibility: "college"
          }
        });
      }

      return {
        recap,
        personalBests: recap.metadata,
        unlockedAchievements
      };
    });

    res.status(201).json({
      ...outcome.recap,
      personalBests: {
        isNewLongestSession: outcome.personalBests.isNewLongestSession,
        isNewMostTasks: outcome.personalBests.isNewMostTasks,
        isNewLongestStreak: outcome.personalBests.isNewLongestStreak
      },
      unlockedAchievements: outcome.unlockedAchievements
    });
  } catch (error) {
    const map = {
      NOT_FOUND: [404, "Mission not found."],
      NOT_PART: [403, "You're not part of this mission."],
      NOT_ACTIVE: [409, "There's no active session to finish. Check in first."]
    };
    if (map[error.message]) return res.status(map[error.message][0]).json({ error: map[error.message][1] });
    throw error;
  }
}

// POST /api/recaps/generate
async function generatePeriodRecap(req, res) {
  const { userId, recapType } = req.body;

  if (!userId || !recapType) {
    return res.status(400).json({ error: "userId and recapType are required." });
  }

  try {
    const numericUserId = Number(userId);

    const filterDate = new Date();
    if (recapType === "weekly") {
      filterDate.setDate(filterDate.getDate() - 7);
    } else if (recapType === "monthly") {
      filterDate.setDate(filterDate.getDate() - 30);
    } else if (recapType === "yearly") {
      filterDate.setMonth(0, 1); // Start of year
      filterDate.setHours(0, 0, 0, 0);
    } else {
      return res.status(400).json({ error: "Invalid recapType. Must be weekly, monthly, or yearly." });
    }

    // Fetch recaps in date range
    const recaps = await prisma.sessionRecap.findMany({
      where: {
        userId: numericUserId,
        recapType: "session",
        generatedAt: { gte: filterDate }
      }
    });

    if (recaps.length === 0) {
      return res.status(200).json({
        recapType,
        sessionDuration: 0,
        tasksCompleted: 0,
        missionsCompleted: 0,
        longestSession: 0,
        currentStreak: 0,
        topCategory: "None",
        categoryBreakdown: []
      });
    }

    // Aggregate statistics
    const totalFocusMinutes = recaps.reduce((sum, r) => sum + r.sessionDuration, 0);
    const totalTasksCompleted = recaps.reduce((sum, r) => sum + r.tasksCompleted, 0);
    const missionsCompleted = recaps.length;
    const longestSession = recaps.reduce((max, r) => Math.max(max, r.sessionDuration), 0);

    // Get current streak (using all past user records)
    const allRecaps = await prisma.sessionRecap.findMany({
      where: { userId: numericUserId, recapType: "session" },
      select: { generatedAt: true }
    });
    const currentStreak = calculateStreak(allRecaps.map(r => r.generatedAt));

    // Calculate category breakdown
    const categoryMinutes = {};
    recaps.forEach(r => {
      const cat = r.categorySnapshot || "Other";
      categoryMinutes[cat] = (categoryMinutes[cat] || 0) + r.sessionDuration;
    });

    // Find top category
    let topCategory = "Other";
    let maxMinutes = 0;
    const categoryBreakdown = Object.entries(categoryMinutes).map(([name, minutes]) => {
      if (minutes > maxMinutes) {
        maxMinutes = minutes;
        topCategory = name;
      }
      return { name, hours: Math.round((minutes / 60) * 10) / 10 };
    });

    categoryBreakdown.sort((a, b) => b.hours - a.hours);

    // Generate unique UUID shareId dynamically
    const shareId = crypto.randomUUID();

    // Save period recap to database so it is shareable publically
    const createdRecap = await prisma.sessionRecap.create({
      data: {
        userId: numericUserId,
        recapType: recapType,
        shareId: shareId,
        sessionDuration: totalFocusMinutes,
        tasksCompleted: totalTasksCompleted,
        streak: currentStreak,
        categorySnapshot: topCategory,
        metadata: {
          missionsCompleted,
          longestSession,
          categoryBreakdown
        }
      }
    });

    res.json({
      recapType,
      shareId: createdRecap.shareId,
      sessionDuration: createdRecap.sessionDuration,
      tasksCompleted: createdRecap.tasksCompleted,
      missionsCompleted,
      longestSession,
      currentStreak: createdRecap.streak,
      topCategory: createdRecap.categorySnapshot,
      categoryBreakdown,
      generatedAt: createdRecap.generatedAt.toISOString()
    });
  } catch (error) {
    if (isDbUnavailable(error)) {
      console.warn("Database offline. Falling back to memoryStore mock for generatePeriodRecap.");
      const shareId = crypto.randomUUID();
      res.json({
        recapType,
        shareId,
        sessionDuration: 180,
        tasksCompleted: 8,
        missionsCompleted: 3,
        longestSession: 60,
        currentStreak: 4,
        topCategory: "Programming",
        categoryBreakdown: [
          { name: "Programming", hours: 2 },
          { name: "Design", hours: 1 }
        ],
        generatedAt: new Date().toISOString()
      });
      return;
    }
    console.error("Error generating period recap", error);
    res.status(500).json({ error: "Failed to generate wrapped card." });
  }
}

// GET /api/recaps/user/:userId
async function getUserRecaps(req, res) {
  // Your gallery only: private recaps (reflections, screenshots) never leave their owner.
  const userId = req.userId;
  const { sortBy, category, year } = req.query;

  try {
    const numericUserId = Number(userId);

    const whereClause = {
      userId: numericUserId,
      recapType: "session"
    };

    if (category && category !== "all") {
      whereClause.categorySnapshot = category;
    }

    if (year && year !== "all") {
      const startOfYear = new Date(Number(year), 0, 1);
      const endOfYear = new Date(Number(year), 11, 31, 23, 59, 59);
      whereClause.generatedAt = {
        gte: startOfYear,
        lte: endOfYear
      };
    }

    // Default sorting
    let orderByClause = { generatedAt: "desc" };
    if (sortBy === "longest") {
      orderByClause = { sessionDuration: "desc" };
    } else if (sortBy === "tasks") {
      orderByClause = { tasksCompleted: "desc" };
    }

    const recaps = await prisma.sessionRecap.findMany({
      where: whereClause,
      orderBy: orderByClause,
      include: {
        mission: {
          select: { location: true }
        }
      }
    });

    res.json(recaps);
  } catch (error) {
    if (isDbUnavailable(error)) {
      console.warn("Database offline. Returning empty array for user recaps.");
      res.json([]);
      return;
    }
    console.error("Error fetching user recaps", error);
    res.status(500).json({ error: "Failed to load recaps list." });
  }
}

// GET /api/recaps/mission/:missionId/user/:userId
async function getMissionRecap(req, res) {
  const missionId = Number(req.params.missionId);
  const userId = req.userId;

  try {
    const recap = await prisma.sessionRecap.findFirst({
      where: {
        missionId,
        userId
      }
    });

    if (!recap) {
      return res.status(404).json({ error: "No recap found for this session." });
    }

    res.json(recap);
  } catch (error) {
    if (isDbUnavailable(error)) {
      console.warn("Database offline. Returning mock mission recap.");
      res.json({
        id: 999,
        userId: Number(userId),
        missionId: missionId,
        missionTitle: "Mock Focus Run",
        categorySnapshot: "Programming",
        sessionDuration: 45,
        tasksCompleted: 3,
        streak: 2,
        missionRank: 1,
        shareId: "mock-share-" + missionId,
        recapType: "session",
        generatedAt: new Date().toISOString()
      });
      return;
    }
    console.error("Error fetching mission recap", error);
    res.status(500).json({ error: "Failed to load session recap." });
  }
}

// GET /api/recaps/share/:shareId
// Read-only public share lookups, rate-limited and exposing NO private student records
async function getPublicShareRecap(req, res) {
  const { shareId } = req.params;

  try {
    const recap = await prisma.sessionRecap.findUnique({
      where: { shareId },
      include: {
        user: {
          select: {
            name: true,
            department: true,
            college: true
          }
        }
      }
    });

    // Private recaps are not shareable, even with the link.
    if (!recap || !recap.isPublic) {
      return res.status(404).json({ error: "Recap page not found." });
    }

    // Strip out any potentially sensitive fields (like private configs or deep system records)
    const securePayload = {
      recapType: recap.recapType,
      missionTitle: recap.missionTitle,
      categorySnapshot: recap.categorySnapshot,
      sessionDuration: recap.sessionDuration,
      tasksCompleted: recap.tasksCompleted,
      streak: recap.streak,
      missionRank: recap.missionRank,
      achievements: recap.achievements,
      participantCount: recap.participantCount,
      generatedAt: recap.generatedAt,
      metadata: recap.metadata,
      reflectionText: recap.isPublic ? recap.reflectionText : null,
      lessonsLearned: recap.isPublic ? recap.lessonsLearned : null,
      creator: {
        name: recap.user.name,
        department: recap.user.department,
        college: recap.user.college
      }
    };

    res.json(securePayload);
  } catch (error) {
    if (isDbUnavailable(error)) {
      console.warn("Database offline. Returning mock public share recap.");
      res.json({
        recapType: "weekly",
        missionTitle: "Weekly Progress Run",
        categorySnapshot: "Programming",
        sessionDuration: 180,
        tasksCompleted: 8,
        streak: 4,
        missionRank: 1,
        achievements: [{ id: 1, title: "Consistent Agent" }],
        participantCount: 1,
        generatedAt: new Date().toISOString(),
        metadata: {
          missionsCompleted: 3,
          longestSession: 60
        },
        creator: {
          name: "Rayaan Arora",
          department: "CSE, 3rd Year",
          college: "SRM IST, Kattankulathur (KTR)"
        }
      });
      return;
    }
    console.error("Error loading shared recap page", error);
    res.status(500).json({ error: "Server error loading shared page." });
  }
}

module.exports = {
  finishSession,
  generatePeriodRecap,
  getUserRecaps,
  getMissionRecap,
  getPublicShareRecap
};
