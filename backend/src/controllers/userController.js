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
    college: "SRM Institute of Science and Technology KTR",
    college_id: college_id.trim(),
    department: department.trim(),
    location: location.trim()
  };
  const email = `${payload.college_id.toLowerCase().replace(/[^a-z0-9]/g, "")}@srmist.edu.in`;

  try {
    const user = await prisma.user.create({
      data: {
        name: payload.name,
        email: email,
        department: payload.department,
        reputationScore: 0
      }
    });

    res.status(201).json({
      id: user.id,
      name: user.name,
      college: payload.college,
      college_id: user.email,
      department: user.department,
      reputation_score: user.reputationScore,
      location: payload.location
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
      college: 'SRM Institute of Science and Technology KTR',
      college_id: user.email,
      department: user.department,
      reputation_score: user.reputationScore,
      location: 'SRM KTR Campus'
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

module.exports = { createUser, getUser, getLockStatus };
