const prisma = require("../config/db");
const memoryStore = require("../data/memoryStore");
const { isDbUnavailable } = require("../utils/dbFallback");

function required(value) {
  return typeof value === "string" && value.trim().length > 0;
}

async function createUser(req, res) {
  const { name, college, college_id, department, location } = req.body;

  if (![name, college, college_id, department, location].every(required)) {
    return res.status(400).json({ error: "Name, college, college_id, department, and location are required." });
  }

  const payload = {
    name: name.trim(),
    college: college.trim(),
    college_id: college_id.trim(),
    department: department.trim(),
    location: location.trim()
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
        location: payload.location,
        reputationScore: 0
      }
    });

    res.status(201).json({
      id: user.id,
      name: user.name,
      college: user.college,
      college_id: user.email,
      department: user.department,
      reputation_score: user.reputationScore,
      location: user.location
    });
  } catch (error) {
    if (!isDbUnavailable(error)) throw error;
    res.status(201).json(memoryStore.createUser(payload));
  }
}

async function getUser(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(req.params.id) }
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
      location: user.location || 'SRM KTR Campus'
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
  const { name, department, location } = req.body;

  try {
    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: {
        name: name ? name.trim() : undefined,
        department: department ? department.trim() : undefined,
        location: location ? location.trim() : undefined
      }
    });

    res.json({
      id: user.id,
      name: user.name,
      college: user.college,
      college_id: user.email,
      department: user.department,
      reputation_score: user.reputationScore,
      location: user.location
    });
  } catch (error) {
    if (!isDbUnavailable(error)) throw error;
    res.json({ error: "Database unavailable fallback not configured for updating users." });
  }
}

module.exports = { createUser, getUser, getLockStatus, updateUser };
