const prisma = require("../config/db");
const { toId, cleanText, rateLimit } = require("../utils/security");
const { notifyMissionChat } = require("../utils/realtime");

// Chat is for the host and approved participants (including mid-session).
async function canChat(missionId, userId) {
  const mission = await prisma.mission.findUnique({ where: { id: missionId }, select: { createdBy: true } });
  if (!mission) return false;
  if (mission.createdBy === userId) return true;
  const p = await prisma.participation.findUnique({
    where: { unique_user_mission: { userId, missionId } },
    select: { status: true }
  });
  return !!p && ["Accepted", "Executing", "Completed", "Missed"].includes(p.status);
}

async function getMessages(req, res) {
  const missionId = toId(req.params.missionId);
  if (!missionId) return res.status(400).json({ error: "Invalid mission." });
  if (!(await canChat(missionId, req.userId))) {
    return res.status(403).json({ error: "Chat unlocks once you're approved for the mission." });
  }

  const messages = await prisma.message.findMany({
    where: { missionId },
    orderBy: { createdAt: "asc" },
    take: 500,
    include: { sender: { select: { name: true, username: true } } }
  });
  // Opening the chat reads it (inbox unread counts).
  const { markMissionChatRead } = require("./inboxController");
  await markMissionChatRead(missionId, req.userId);

  res.json(
    messages.map((m) => ({
      id: m.id,
      mission_id: m.missionId,
      sender_id: m.senderId,
      message: m.message,
      created_at: m.createdAt,
      sender_name: m.sender.name,
      sender_username: m.sender.username || null
    }))
  );
}

async function sendMessage(req, res) {
  const missionId = toId(req.params.missionId);
  const text = cleanText(req.body && req.body.message, 1000);
  if (!missionId || !text) return res.status(400).json({ error: "Message can't be empty." });
  if (!(await canChat(missionId, req.userId))) {
    return res.status(403).json({ error: "Chat unlocks once you're approved for the mission." });
  }

  const rl = rateLimit(`chat:${req.userId}`, 20, 60e3);
  if (!rl.ok) {
    res.setHeader("Retry-After", String(rl.retryAfter));
    return res.status(429).json({ error: "You're sending messages too quickly." });
  }

  const msg = await prisma.message.create({
    data: { missionId, senderId: req.userId, message: text },
    include: { sender: { select: { name: true, username: true } } }
  });

  const response = {
    id: msg.id,
    mission_id: msg.missionId,
    sender_id: msg.senderId,
    message: msg.message,
    created_at: msg.createdAt,
    sender_name: msg.sender.name,
    sender_username: msg.sender.username || null
  };

  await notifyMissionChat(missionId, response);
  res.status(201).json(response);
}

module.exports = { getMessages, sendMessage, canChat };
