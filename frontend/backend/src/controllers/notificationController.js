const prisma = require("../config/db");
const { toId } = require("../utils/security");

// Every handler runs behind getAuthUser(): req.userId is the verified session user,
// and every query is scoped to it.

const actorSelect = { id: true, name: true, username: true, avatarUrl: true };

function view(n) {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    mission_id: n.missionId,
    mission_title: n.mission ? n.mission.title : null,
    post_id: n.postId,
    actor: n.actor ? { id: n.actor.id, name: n.actor.name, username: n.actor.username || null, avatar_url: n.actor.avatarUrl || null } : null,
    read: !!n.readAt,
    created_at: n.createdAt
  };
}

// GET /api/notifications?before=<id>
async function listNotifications(req, res) {
  const before = toId(req.query.before);
  const rows = await prisma.notification.findMany({
    where: { userId: req.userId, ...(before ? { id: { lt: before } } : {}) },
    orderBy: { id: "desc" },
    take: 41,
    include: { actor: { select: actorSelect }, mission: { select: { title: true } } }
  });
  res.json({ notifications: rows.slice(0, 40).map(view), has_more: rows.length > 40 });
}

// GET /api/notifications/unread
async function unreadNotifications(req, res) {
  const count = await prisma.notification.count({ where: { userId: req.userId, readAt: null } });
  res.json({ count });
}

// POST /api/notifications/read  (all)   ·   POST /api/notifications/:id/read
async function markRead(req, res) {
  const id = toId(req.params && req.params.id);
  const where = { userId: req.userId, readAt: null, ...(id ? { id } : {}) };
  const r = await prisma.notification.updateMany({ where, data: { readAt: new Date() } });
  res.json({ updated: r.count });
}

module.exports = { listNotifications, unreadNotifications, markRead };
