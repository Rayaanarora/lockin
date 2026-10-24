const prisma = require("../config/db");
const { toId, cleanText, safeImageRef } = require("../utils/security");
const { isDbUnavailable } = require("../utils/dbFallback");

function required(value) {
  return typeof value === "string" && value.trim().length > 0;
}

// Profiles are created by POST /api/auth/profile from the verified session
// (email and auth id come from Supabase, not from the request). This legacy
// endpoint is disabled so nobody can mint a profile for an arbitrary email.
async function createUser(req, res) {
  return res.status(410).json({ error: "Use /api/auth/profile to create your profile." });
}

// GET /api/users/:id: the full private profile, for its owner only (the route
// enforces :id === session user). Other people use /api/users/:id/public.
async function getUser(req, res) {
  const user = await prisma.user.findUnique({ where: { id: req.userId }, include: { collegeRef: true } });
  if (!user) return res.status(404).json({ error: "User not found." });
  res.json(privateView(user));
}

async function getLockStatus(req, res) {
  // Same rule acceptMission enforces: at most 3 open missions at a time.
  const activeCount = await prisma.participation.count({
    where: { userId: req.userId, status: { in: ["Requested", "Accepted", "Executing"] } }
  });
  res.json({ locked: activeCount >= 3, active_count: activeCount, max_active_missions: 3 });
}

// PUT /api/users/:id (owner only; the route enforces :id === session user).
async function updateUser(req, res) {
  const userId = req.userId;
  const b = req.body || {};
  const data = {};

  const text = { name: 50, department: 50, bio: 150, location: 100 };
  for (const [key, max] of Object.entries(text)) {
    if (b[key] !== undefined) data[key] = cleanText(b[key], max);
  }
  if (data.name === null || (data.name !== undefined && data.name.length < 2)) {
    return res.status(400).json({ error: "Name must be at least 2 characters." });
  }
  for (const key of ["instagram", "github"]) {
    if (b[key] !== undefined) {
      const handle = cleanText(String(b[key]).replace(/^@/, ""), 50);
      if (handle && !/^[A-Za-z0-9._-]+$/.test(handle)) return res.status(400).json({ error: `That ${key} handle isn't valid.` });
      data[key] = handle;
    }
  }
  if (b.interests !== undefined) data.interests = cleanText(b.interests, 500);
  if (b.avatarUrl !== undefined) {
    const avatar = safeImageRef(b.avatarUrl);
    if (avatar === undefined) return res.status(400).json({ error: "Upload your photo first." });
    data.avatarUrl = avatar;
  }

  // Campus decides which feed you see, so it can't be switched freely:
  // set once during onboarding, or later only to a campus on your email domain.
  const requestedCollege = b.collegeId !== undefined ? b.collegeId : b.campusId;
  if (requestedCollege !== undefined && requestedCollege !== null && requestedCollege !== "") {
    const collegeId = toId(requestedCollege);
    const current = await prisma.user.findUnique({ where: { id: userId }, select: { collegeId: true, email: true } });
    if (collegeId && current && collegeId !== current.collegeId) {
      const college = await prisma.college.findUnique({ where: { id: collegeId } });
      if (!college) return res.status(400).json({ error: "Unknown college." });
      const domain = (current.email || "").split("@")[1] || "";
      const onDomain = !!college.emailDomain && (domain === college.emailDomain || domain.endsWith(`.${college.emailDomain}`));
      if (current.collegeId && !onDomain) {
        return res.status(403).json({ error: "You can only switch to a campus that matches your college email." });
      }
      data.collegeId = collegeId;
      data.college = college.shortName;
    }
  } else if (b.college !== undefined) {
    // Free-text college name ("not listed") is display-only.
    data.college = cleanText(b.college, 100);
  }

  const user = await prisma.user.update({ where: { id: userId }, data, include: { collegeRef: true } });
  res.json(privateView(user));
}

/** What the owner sees about themselves. Still no auth ids. */
function privateView(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    college: user.college,
    college_id: user.email, // legacy field name the UI expects
    department: user.department,
    reputation_score: user.reputationScore,
    location: user.location,
    bio: user.bio,
    instagram: user.instagram,
    github: user.github,
    interests: user.interests,
    campus_id: user.collegeId,
    campus_name: user.collegeRef ? user.collegeRef.shortName : user.college || "",
    verified_at: user.verifiedAt,
    avatar_url: user.avatarUrl || null
  };
}

async function getLeaderboard(req, res) {
  const { campusId, collegeId: cId } = req.query;
  const effectiveCollegeId = cId || campusId;
  if (!effectiveCollegeId) {
    return res.status(400).json({ error: "campusId or collegeId query parameter is required." });
  }

  try {
    const leaderboard = await prisma.user.findMany({
      where: { collegeId: Number(effectiveCollegeId) },
      orderBy: { reputationScore: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        department: true,
        reputationScore: true,
        interests: true
      }
    });

    const rows = leaderboard.map((u) => ({
      id: u.id,
      name: u.name,
      department: u.department,
      reputation_score: u.reputationScore,
      interests: u.interests
    }));

    res.json(rows);
  } catch (error) {
    if (!isDbUnavailable(error)) throw error;
    res.json([]);
  }
}

async function getUserHeat(req, res) {
  const userId = Number(req.params.id);
  if (isNaN(userId)) {
    return res.status(400).json({ error: "Invalid user ID." });
  }

  try {
    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);
    oneYearAgo.setHours(0, 0, 0, 0);

    const activities = await prisma.dailyActivity.findMany({
      where: {
        userId,
        date: { gte: oneYearAgo }
      },
      orderBy: { date: "asc" }
    });

    res.json(activities);
  } catch (error) {
    if (isDbUnavailable(error)) {
      console.warn("Database offline. Returning empty array for user heat map.");
      res.json([]);
      return;
    }
    console.error("Error fetching user activity heat", error);
    res.status(500).json({ error: "Failed to load heat map data." });
  }
}

async function getPublicProfile(req, res) {
  const userId = Number(req.params.id);
  const viewerId = req.query.viewerId ? Number(req.query.viewerId) : null;

  if (isNaN(userId)) {
    return res.status(400).json({ error: "Invalid user ID." });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        collegeRef: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // 1. Fetch Stats
    const recaps = await prisma.sessionRecap.findMany({
      where: { userId, recapType: "session" }
    });

    const totalMissions = recaps.length;
    const totalFocusMinutes = recaps.reduce((sum, r) => sum + r.sessionDuration, 0);
    const focusHours = Number((totalFocusMinutes / 60).toFixed(1));

    const totalJoined = await prisma.participation.count({ where: { userId } });
    const totalCompleted = await prisma.participation.count({ where: { userId, status: "Completed" } });
    const completionRate = totalJoined > 0 ? Math.round((totalCompleted / totalJoined) * 100) : 100;

    const latestRecap = await prisma.sessionRecap.findFirst({
      where: { userId, recapType: "session" },
      orderBy: { generatedAt: "desc" }
    });
    const currentStreak = latestRecap ? latestRecap.streak : 0;

    // Tasks completed (count tasks that are completed and belong to missions created by this user or where they participated)
    const tasksCompleted = await prisma.task.count({
      where: {
        mission: { createdBy: userId },
        completed: true
      }
    });

    // Active days count
    const activeDays = await prisma.dailyActivity.count({
      where: { userId }
    });

    // 2. Fetch Follow Counts
    const followersCount = await prisma.follow.count({ where: { followingId: userId } });
    const followingCount = await prisma.follow.count({ where: { followerId: userId } });

    // Check if viewer follows this user
    let isFollowing = false;
    if (viewerId) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: viewerId,
            followingId: userId
          }
        }
      });
      isFollowing = !!follow;
    }

    // 3. Fetch Recent Feed Items (last 10)
    const feedItems = await prisma.feedItem.findMany({
      where: { userId },
      orderBy: { id: "desc" },
      take: 10,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            department: true,
            college: true,
            reputationScore: true
          }
        }
      }
    });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        college: user.college,
        department: user.department,
        reputation_score: user.reputationScore,
        bio: user.bio,
        instagram: user.instagram,
        github: user.github,
        interests: user.interests,
        campus_id: user.collegeId,
        campus_name: user.collegeRef?.shortName || "",
        verified_at: user.verifiedAt,
        avatar_url: user.avatarUrl || null
      },
      stats: {
        totalMissions,
        focusHours,
        completionRate,
        currentStreak,
        tasksCompleted,
        activeDays
      },
      followersCount,
      followingCount,
      isFollowing,
      feedItems
    });
  } catch (error) {
    if (isDbUnavailable(error)) {
      console.warn("Database offline. Returning mock public profile.");
      res.json({
        user: {
          id: userId,
          name: "Mock User",
          college: "SRM KTR",
          college_id: "mock@srmist.edu.in",
          department: "CSE",
          reputation_score: 150,
          bio: "Just locking in.",
          instagram: "",
          github: "",
          interests: "",
          campus_id: 1,
          campus_name: "KTR Campus"
        },
        stats: {
          totalMissions: 5,
          focusHours: 3.5,
          completionRate: 100,
          currentStreak: 3,
          tasksCompleted: 12,
          activeDays: 4
        },
        followersCount: 10,
        followingCount: 12,
        isFollowing: false,
        feedItems: []
      });
      return;
    }
    console.error("Error fetching public profile", error);
    res.status(500).json({ error: "Failed to load public profile." });
  }
}

async function searchUsers(req, res) {
  const q = req.query.q || '';
  const currentUserId = req.query.currentUserId ? Number(req.query.currentUserId) : null;

  if (q.trim().length < 2) {
    return res.json([]);
  }

  const cleanQuery = q.trim();

  try {
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: cleanQuery, mode: "insensitive" } },
              { department: { contains: cleanQuery, mode: "insensitive" } }
            ]
          },
          currentUserId ? { id: { not: currentUserId } } : {}
        ]
      },
      select: {
        id: true,
        name: true,
        department: true,
        college: true,
        reputationScore: true,
        avatarUrl: true
      },
      take: 20
    });

    res.json(users.map(u => ({
      id: u.id,
      name: u.name,
      department: u.department,
      college: u.college || 'SRM Institute of Science and Technology KTR',
      reputationScore: u.reputationScore,
      avatar_url: u.avatarUrl || null
    })));
  } catch (error) {
    if (isDbUnavailable(error)) {
      res.json([]);
      return;
    }
    console.error("Error searching users", error);
    res.status(500).json({ error: "Failed to search users." });
  }
}

module.exports = {
  createUser,
  getUser,
  getLockStatus,
  updateUser,
  getLeaderboard,
  getUserHeat,
  getPublicProfile,
  searchUsers
};
