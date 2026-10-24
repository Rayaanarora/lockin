const prisma = require("../config/db");
const { toId, cleanText } = require("../utils/security");

// Who may see / change a mission's checklist: its host and its approved
// participants. Everyone else gets 404 so mission ids can't be probed.
const READ_STATUSES = ["Accepted", "Executing", "Completed", "Missed"];
const WRITE_STATUSES = ["Accepted", "Executing"];

async function missionAccess(missionId, userId) {
  const mission = await prisma.mission.findUnique({ where: { id: missionId }, select: { createdBy: true } });
  if (!mission) return { read: false, write: false };
  if (mission.createdBy === userId) return { read: true, write: true };
  const p = await prisma.participation.findUnique({
    where: { unique_user_mission: { userId, missionId } },
    select: { status: true }
  });
  if (!p) return { read: false, write: false };
  return { read: READ_STATUSES.includes(p.status), write: WRITE_STATUSES.includes(p.status) };
}

const notFound = (res) => res.status(404).json({ error: "Mission not found." });

// GET /api/tasks/mission/:missionId
async function getTasksForMission(req, res) {
  const missionId = toId(req.params.missionId);
  if (!missionId) return res.status(400).json({ error: "Invalid mission." });
  if (!(await missionAccess(missionId, req.userId)).read) return notFound(res);

  const tasks = await prisma.task.findMany({ where: { missionId }, orderBy: { position: "asc" } });
  res.json(tasks);
}

// POST /api/tasks
async function createTask(req, res) {
  const missionId = toId(req.body && req.body.missionId);
  const title = cleanText(req.body && req.body.title, 200);
  if (!missionId || !title) return res.status(400).json({ error: "A task title is required." });
  if (!(await missionAccess(missionId, req.userId)).write) return notFound(res);

  const count = await prisma.task.count({ where: { missionId } });
  if (count >= 30) return res.status(400).json({ error: "A mission can have up to 30 tasks." });

  const position = Number.isInteger(Number(req.body.position)) ? Math.max(0, Number(req.body.position)) : count;
  const task = await prisma.task.create({ data: { title, missionId, position } });
  res.status(201).json(task);
}

// POST /api/tasks/batch
async function createBatchTasks(req, res) {
  const missionId = toId(req.body && req.body.missionId);
  const input = Array.isArray(req.body && req.body.tasks) ? req.body.tasks : null;
  if (!missionId || !input) return res.status(400).json({ error: "tasks and missionId are required." });
  if (!(await missionAccess(missionId, req.userId)).write) return notFound(res);

  const existing = await prisma.task.count({ where: { missionId } });
  const data = input
    .map((t, idx) => ({ title: cleanText(t && t.title, 200), position: existing + idx, missionId }))
    .filter((t) => t.title)
    .slice(0, Math.max(0, 30 - existing));

  if (data.length) await prisma.task.createMany({ data });
  const tasks = await prisma.task.findMany({ where: { missionId }, orderBy: { position: "asc" } });
  res.status(201).json(tasks);
}

async function loadTaskForWrite(req, res) {
  const id = toId(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Invalid task." });
    return null;
  }
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task || !(await missionAccess(task.missionId, req.userId)).write) {
    res.status(404).json({ error: "Task not found." });
    return null;
  }
  return task;
}

// PUT /api/tasks/:id/toggle
async function toggleTask(req, res) {
  const task = await loadTaskForWrite(req, res);
  if (!task) return;
  const completed = !task.completed;
  const updated = await prisma.task.update({
    where: { id: task.id },
    data: { completed, completedAt: completed ? new Date() : null }
  });
  res.json(updated);
}

// DELETE /api/tasks/:id
async function deleteTask(req, res) {
  const task = await loadTaskForWrite(req, res);
  if (!task) return;
  await prisma.task.delete({ where: { id: task.id } });
  res.json({ message: "Task deleted." });
}

module.exports = { getTasksForMission, createTask, createBatchTasks, toggleTask, deleteTask };
