const prisma = require("../config/db");
const memoryStore = require("../data/memoryStore");
const { isDbUnavailable } = require("../utils/dbFallback");

function assertUserId(userId, res) {
  if (!userId) {
    res.status(400).json({ error: "userId is required." });
    return false;
  }
  return true;
}

async function createMission(req, res) {
  const { creator_id, title, description, location, datetime } = req.body;
  if (!creator_id || !title || !description || !location || !datetime) {
    return res.status(400).json({ error: "creator_id, title, description, location, and datetime are required." });
  }

  const payload = {
    creator_id: Number(creator_id),
    title: title.trim(),
    description: description.trim(),
    location: location.trim(),
    datetime: new Date(datetime)
  };

  try {
    const mission = await prisma.mission.create({
      data: {
        title: payload.title,
        datetime: payload.datetime,
        location: payload.location,
        categoryId: 1, // Default Coding
        createdBy: payload.creator_id
      },
      include: {
        creator: {
          select: { name: true, department: true }
        }
      }
    });

    res.status(201).json({
      id: mission.id,
      creator_id: mission.createdBy,
      title: mission.title,
      description: mission.title, // Map description to title as in original MySQL code
      location: mission.location,
      datetime: mission.datetime.toISOString(),
      creator_name: mission.creator?.name || "Unknown",
      creator_department: mission.creator?.department || "Creator"
    });
  } catch (error) {
    if (!isDbUnavailable(error)) throw error;
    res.status(201).json(memoryStore.createMission(payload));
  }
}

async function getMissionFeed(req, res) {
  const { userId } = req.query;
  if (!assertUserId(userId, res)) return;

  try {
    const twelveHoursAgo = new Date();
    twelveHoursAgo.setHours(twelveHoursAgo.getHours() - 12);

    const numericUserId = Number(userId);

    const missions = await prisma.mission.findMany({
      where: {
        createdBy: { not: numericUserId },
        datetime: { gte: twelveHoursAgo },
        participations: {
          none: {
            userId: numericUserId
          }
        }
      },
      orderBy: { datetime: "asc" },
      include: {
        category: true,
        creator: true
      }
    });

    const rows = missions.map((m) => ({
      id: m.id,
      creator_id: m.createdBy,
      title: m.title,
      description: `Category: ${m.category?.categoryName || "Coding"}. Meet at ${m.location} and execute the mission.`,
      location: m.location,
      datetime: m.datetime.toISOString(),
      creator_name: m.creator?.name || "Unknown",
      creator_department: m.creator?.department || "Creator"
    }));

    res.json(rows);
  } catch (error) {
    if (!isDbUnavailable(error)) throw error;
    res.json(memoryStore.getMissionFeed(userId));
  }
}

async function acceptMission(req, res) {
  const { id } = req.params;
  const { userId } = req.body;
  if (!assertUserId(userId, res)) return;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const activeCount = await tx.participation.count({
        where: {
          userId: Number(userId),
          showedUp: null
        }
      });

      if (activeCount >= 3) {
        throw new Error("LOCKED_OUT");
      }

      const mission = await tx.mission.findUnique({
        where: { id: Number(id) }
      });

      if (!mission) {
        throw new Error("NOT_FOUND");
      }

      const participation = await tx.participation.upsert({
        where: {
          userId_missionId: {
            userId: Number(userId),
            missionId: Number(id)
          }
        },
        update: { status: "Pending" },
        create: {
          userId: Number(userId),
          missionId: Number(id),
          status: "Pending"
        }
      });

      return participation;
    });

    res.status(201).json({
      mission_id: result.missionId,
      user_id: result.userId,
      status: result.status
    });
  } catch (error) {
    if (error.message === "LOCKED_OUT") {
      return res.status(423).json({ error: "You are locked in. Mark attendance before accepting more missions." });
    }
    if (error.message === "NOT_FOUND") {
      return res.status(404).json({ error: "Mission not found." });
    }
    if (isDbUnavailable(error)) {
      const result = memoryStore.acceptMission(id, userId);
      if (result.error) return res.status(result.status).json({ error: result.error });
      return res.status(201).json(result);
    }
    throw error;
  }
}

async function passMission(req, res) {
  res.json({ mission_id: Number(req.params.id), passed: true });
}

async function getActiveMissions(req, res) {
  const { userId } = req.params;
  try {
    const participations = await prisma.participation.findMany({
      where: { userId: Number(userId) },
      include: {
        mission: {
          include: {
            category: true,
            creator: true
          }
        }
      }
    });

    const rows = participations
      .map((p) => {
        if (!p.mission) return null;
        return {
          id: p.mission.id,
          creator_id: p.mission.createdBy,
          title: p.mission.title,
          description: `Category: ${p.mission.category?.categoryName || "Coding"}. Meet at ${p.mission.location} and execute the mission.`,
          location: p.mission.location,
          datetime: p.mission.datetime.toISOString(),
          status: p.status,
          showed_up: p.showedUp,
          creator_name: p.mission.creator?.name || "Unknown"
        };
      })
      .filter(Boolean);

    // Sort: showed_up = null first, then datetime
    rows.sort((a, b) => {
      if (a.showed_up === null && b.showed_up !== null) return -1;
      if (a.showed_up !== null && b.showed_up === null) return 1;
      return new Date(a.datetime) - new Date(b.datetime);
    });

    res.json(rows);
  } catch (error) {
    if (!isDbUnavailable(error)) throw error;
    res.json(memoryStore.getActiveMissions(userId));
  }
}

async function submitAttendance(req, res) {
  const { id } = req.params;
  const { userId, showedUp } = req.body;
  if (!assertUserId(userId, res)) return;
  if (typeof showedUp !== "boolean") {
    return res.status(400).json({ error: "showedUp must be true or false." });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const participant = await tx.participation.findFirst({
        where: {
          missionId: Number(id),
          userId: Number(userId)
        }
      });

      if (!participant) {
        throw new Error("NOT_FOUND");
      }

      if (participant.showedUp !== null) {
        throw new Error("ALREADY_SUBMITTED");
      }

      const status = showedUp ? "Completed" : "Missed";
      const delta = showedUp ? 10 : -5;

      await tx.participation.update({
        where: { id: participant.id },
        data: { showedUp, status }
      });

      const updatedUser = await tx.user.update({
        where: { id: Number(userId) },
        data: {
          reputationScore: {
            increment: delta
          }
        }
      });

      return {
        status,
        reputationScore: updatedUser.reputationScore
      };
    });

    res.json({
      mission_id: Number(id),
      user_id: Number(userId),
      status: result.status,
      reputation_score: result.reputationScore
    });
  } catch (error) {
    if (error.message === "NOT_FOUND") {
      return res.status(404).json({ error: "Accepted mission not found." });
    }
    if (error.message === "ALREADY_SUBMITTED") {
      return res.status(409).json({ error: "Attendance has already been submitted." });
    }
    if (isDbUnavailable(error)) {
      const result = memoryStore.submitAttendance(id, userId, showedUp);
      if (result.error) return res.status(result.status).json({ error: result.error });
      return res.json(result);
    }
    throw error;
  }
}

module.exports = {
  createMission,
  getMissionFeed,
  acceptMission,
  passMission,
  getActiveMissions,
  submitAttendance
};
