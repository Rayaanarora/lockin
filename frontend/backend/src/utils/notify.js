const prisma = require("../config/db");
const { broadcast } = require("./realtime");

/**
 * Save a notification and push it live to the user's private channel.
 * Never throws: a failed notification must not fail the action behind it.
 *
 *   notify(userId, { type, title, body?, actorId?, missionId?, postId? })
 */
async function notify(userId, n) {
  const target = Number(userId);
  if (!target || (n.actorId && Number(n.actorId) === target)) return;
  try {
    const saved = await prisma.notification.create({
      data: {
        userId: target,
        actorId: n.actorId || null,
        type: String(n.type).slice(0, 30),
        title: String(n.title).slice(0, 200),
        body: n.body ? String(n.body).slice(0, 1000) : null,
        missionId: n.missionId || null,
        postId: n.postId || null
      }
    });
    await broadcast(`notifications:${target}`, "push_notification", {
      id: saved.id,
      type: saved.type,
      title: saved.title,
      message: saved.body || "",
      missionId: saved.missionId,
      postId: saved.postId
    });
  } catch (err) {
    console.error("[notify] failed", err && err.message);
  }
}

module.exports = { notify };
