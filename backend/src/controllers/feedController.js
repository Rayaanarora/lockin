const prisma = require("../config/db");
const { isDbUnavailable } = require("../utils/dbFallback");

// GET /api/feed
async function getFeed(req, res) {
  const userId = Number(req.query.userId);
  const filter = req.query.filter || "all"; // "all" | "following" | "campus"
  const limit = Number(req.query.limit) || 20;
  const cursor = req.query.cursor ? Number(req.query.cursor) : undefined;

  if (isNaN(userId)) {
    return res.status(400).json({ error: "userId query parameter is required and must be a number." });
  }

  try {
    const whereClause = {};

    if (filter === "following") {
      // Find who the user is following
      const follows = await prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true }
      });
      const followingIds = follows.map(f => f.followingId);
      // Include following users + current user themselves
      whereClause.userId = { in: [...followingIds, userId] };
    } else if (filter === "campus") {
      // Find current user's campus
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { campusId: true }
      });
      if (user && user.campusId) {
        whereClause.user = { campusId: user.campusId };
      } else {
        // If user has no campus, campus feed is just empty or fallback to user's own campusId if not set
        whereClause.userId = userId;
      }
    }

    const queryOptions = {
      take: limit,
      where: whereClause,
      orderBy: { id: "desc" },
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
    };

    if (cursor) {
      queryOptions.cursor = { id: cursor };
      queryOptions.skip = 1;
    }

    const feedItems = await prisma.feedItem.findMany(queryOptions);

    // Get next cursor
    const nextCursor = feedItems.length === limit ? feedItems[feedItems.length - 1].id : null;

    res.json({
      feedItems,
      nextCursor
    });
  } catch (error) {
    if (isDbUnavailable(error)) {
      console.warn("Database offline. Returning mock feed items.");
      res.json({
        feedItems: [
          {
            id: 1,
            userId,
            type: "mission_completed",
            title: "Completed: Gym Session",
            description: "Crushed leg day today. High intensity.",
            metadata: {
              sessionDuration: 45,
              tasksCompleted: 4,
              category: "Fitness",
              missionType: "solo",
              participantCount: 1
            },
            recapId: 999,
            createdAt: new Date().toISOString(),
            user: {
              id: userId,
              name: "Rayaan Arora",
              department: "CSE",
              college: "SRM KTR",
              reputationScore: 240
            }
          }
        ],
        nextCursor: null
      });
      return;
    }
    console.error("Error fetching activity feed", error);
    res.status(500).json({ error: "Failed to load activity feed." });
  }
}

// GET /api/feed/user/:userId
async function getUserFeed(req, res) {
  const userId = Number(req.params.userId);
  if (isNaN(userId)) {
    return res.status(400).json({ error: "Invalid user ID." });
  }

  try {
    const feedItems = await prisma.feedItem.findMany({
      where: { userId },
      orderBy: { id: "desc" },
      take: 15,
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

    res.json(feedItems);
  } catch (error) {
    if (isDbUnavailable(error)) {
      console.warn("Database offline. Returning empty user feed.");
      res.json([]);
      return;
    }
    console.error("Error fetching user feed items", error);
    res.status(500).json({ error: "Failed to load user feed." });
  }
}

module.exports = {
  getFeed,
  getUserFeed
};
