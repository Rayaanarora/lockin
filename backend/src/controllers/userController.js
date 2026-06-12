const prisma = require("../config/db");
const memoryStore = require("../data/memoryStore");
const { isDbUnavailable } = require("../utils/dbFallback");

function required(value) {
  return typeof value === "string" && value.trim().length > 0;
}

async function createUser(req, res) {
  const { name, college, college_id, department, bio, instagram, github, interests, campusId } = req.body;

  if (![name, college, college_id, department].every(required)) {
    return res.status(400).json({ error: "Name, college, college_id, and department are required." });
  }

  const payload = {
    name: name.trim(),
    college: college.trim(),
    college_id: college_id.trim(),
    department: department.trim(),
    bio: bio ? bio.trim() : "",
    instagram: instagram ? instagram.trim() : "",
    github: github ? github.trim() : "",
    interests: interests ? interests.trim() : "",
    campusId: campusId ? Number(campusId) : null
  };

  let email = payload.college_id;
  if (!email.includes("@")) {
    email = `${email.toLowerCase().replace(/[^a-z0-9]/g, "")}@srmist.edu.in`;
  }

  try {
    const user = await prisma.user.create({
      data: {
        name: payload.name,
        email: email,
        department: payload.department,
        college: payload.college,
        reputationScore: 100, // Seed initial Aura to 100
        bio: payload.bio,
        instagram: payload.instagram,
        github: payload.github,
        interests: payload.interests,
        campusId: payload.campusId
      }
    });

    res.status(201).json({
      id: user.id,
      name: user.name,
      college: user.college,
      college_id: user.email,
      department: user.department,
      reputation_score: user.reputationScore,
      bio: user.bio,
      instagram: user.instagram,
      github: user.github,
      interests: user.interests,
      campus_id: user.campusId
    });
  } catch (error) {
    if (!isDbUnavailable(error)) throw error;
    res.status(201).json(memoryStore.createUser(payload));
  }
}

async function getUser(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(req.params.id) },
      include: { campus: true }
    });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    res.json({
      id: user.id,
      name: user.name,
      college: user.college || 'SRM Institute of Science and Technology KTR',
      college_id: user.email,
      department: user.department,
      reputation_score: user.reputationScore,
      bio: user.bio || "",
      instagram: user.instagram || "",
      github: user.github || "",
      interests: user.interests || "",
      campus_id: user.campusId,
      campus_name: user.campus?.name || ""
    });
  } catch (error) {
    if (!isDbUnavailable(error)) throw error;
    const user = memoryStore.getUser(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found." });
    res.json(user);
  }
}

async function getLockStatus(req, res) {
  try {
    const activeCount = await prisma.participation.count({
      where: {
        userId: Number(req.params.id),
        status: "Accepted",
        showedUp: null
      }
    });

    res.json({
      locked: activeCount >= 3,
      active_count: activeCount,
      max_active_missions: 3
    });
  } catch (error) {
    if (!isDbUnavailable(error)) throw error;
    res.json(memoryStore.getLockStatus(req.params.id));
  }
}

async function updateUser(req, res) {
  const { id } = req.params;
  const { name, department, bio, instagram, github, interests, location } = req.body;

  try {
    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: {
        name: name ? name.trim() : undefined,
        department: department ? department.trim() : undefined,
        bio: bio !== undefined ? bio.trim() : undefined,
        instagram: instagram !== undefined ? instagram.trim() : undefined,
        github: github !== undefined ? github.trim() : undefined,
        interests: interests !== undefined ? interests.trim() : undefined,
        location: location !== undefined ? location.trim() : undefined
      }
    });

    res.json({
      id: user.id,
      name: user.name,
      college: user.college,
      college_id: user.email,
      department: user.department,
      reputation_score: user.reputationScore,
      bio: user.bio,
      instagram: user.instagram,
      github: user.github,
      interests: user.interests,
      location: user.location
    });
  } catch (error) {
    if (!isDbUnavailable(error)) throw error;
    res.json({ error: "Database unavailable." });
  }
}

async function getLeaderboard(req, res) {
  const { campusId } = req.query;
  if (!campusId) {
    return res.status(400).json({ error: "campusId query parameter is required." });
  }

  try {
    const leaderboard = await prisma.user.findMany({
      where: { campusId: Number(campusId) },
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

module.exports = { createUser, getUser, getLockStatus, updateUser, getLeaderboard };
