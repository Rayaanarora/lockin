const prisma = require("../config/db");
const { toId, cleanText, rateLimit } = require("../utils/security");
const { notifyMissionChat } = require("../utils/realtime");
const { signPaths } = require("../utils/media");

function missionMessageView(m, signed) {
  return {
    id: m.id,
    mission_id: m.missionId,
    sender_id: m.senderId,
    kind: m.kind || "text",
    message: m.message,
    media_url: m.mediaPath && signed ? signed.get(m.mediaPath) || null : null,
    media_meta: m.mediaMeta || null,
    created_at: m.createdAt,
    sender_name: m.sender.name,
    sender_username: m.sender.username || null
  };
}

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

  const signed = await signPaths(messages.map((m) => m.mediaPath));
  res.json(messages.map((m) => missionMessageView(m, signed)));
}

async function sendMessage(req, res) {
  const missionId = toId(req.params.missionId);
  if (!missionId) return res.status(400).json({ error: "Invalid mission." });
  // Same text/photo/voice rules as direct messages (mission text caps at 1000).
  const { readOutgoing } = require("./inboxController");
  const raw = req.body || {};
  const out = readOutgoing({ body: { ...raw, body: raw.body ?? raw.message }, supabaseUser: req.supabaseUser });
  if (out.error) return res.status(400).json({ error: out.error === "Write a message first." ? "Message can't be empty." : out.error });
  out.body = out.body.slice(0, 1000);
  if (!(await canChat(missionId, req.userId))) {
    return res.status(403).json({ error: "Chat unlocks once you're approved for the mission." });
  }

  const rl = rateLimit(`chat:${req.userId}`, 20, 60e3);
  if (!rl.ok) {
    res.setHeader("Retry-After", String(rl.retryAfter));
    return res.status(429).json({ error: "You're sending messages too quickly." });
  }

  const msg = await prisma.message.create({
    data: { missionId, senderId: req.userId, message: out.body, kind: out.kind, mediaPath: out.mediaPath, mediaMeta: out.mediaMeta || undefined },
    include: { sender: { select: { name: true, username: true } } }
  });

  const response = missionMessageView(msg, await signPaths([msg.mediaPath]));

  await notifyMissionChat(missionId, response);
  res.status(201).json(response);
}

module.exports = { getMessages, sendMessage, canChat };
