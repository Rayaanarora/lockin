const prisma = require("../config/db");
const { toId, cleanText, rateLimit } = require("../utils/security");
const { broadcast } = require("../utils/realtime");

// Every handler runs behind getAuthUser(): req.userId is the verified session user.
//
// Direct messages
//   - Only between people on the same campus.
//   - One thread per pair (userAId < userBId).
//   - A new thread is a "request" unless the recipient follows the sender;
//     it becomes "active" when the recipient replies or accepts. Until then
//     the sender can send at most REQUEST_MESSAGE_CAP messages.
// Mission chats appear in the inbox for the host and approved participants
// (the same rule as messageController.canChat).

const REQUEST_MESSAGE_CAP = 3;
const CHAT_STATUSES = ["Accepted", "Executing", "Completed", "Missed"];
const EPOCH = new Date(0);

const person = { id: true, name: true, username: true, avatarUrl: true, department: true, collegeId: true };

const pair = (x, y) => (x < y ? { userAId: x, userBId: y } : { userAId: y, userBId: x });
const otherOf = (t, me) => (t.userAId === me ? t.userB : t.userA);
const myReadAt = (t, me) => (t.userAId === me ? t.aLastReadAt : t.bLastReadAt);
const readField = (t, me) => (t.userAId === me ? "aLastReadAt" : "bLastReadAt");

function personView(u) {
  if (!u) return null;
  return { id: u.id, name: u.name, username: u.username || null, avatar_url: u.avatarUrl || null, department: u.department || null };
}

function dmMessageView(m) {
  return { id: m.id, thread_id: m.threadId, sender_id: m.senderId, body: m.body, created_at: m.createdAt };
}

function threadView(t, me, unread = 0) {
  const last = t.messages && t.messages[0];
  return {
    kind: "dm",
    key: `dm:${t.id}`,
    thread_id: t.id,
    status: t.status,
    incoming_request: t.status === "request" && t.startedBy !== me,
    outgoing_request: t.status === "request" && t.startedBy === me,
    other: personView(otherOf(t, me)),
    last_message: last ? dmMessageView(last) : null,
    last_at: (last ? last.createdAt : t.lastMessageAt).toISOString(),
    unread
  };
}

async function loadThreadFor(threadId, me) {
  const t = await prisma.dmThread.findUnique({
    where: { id: threadId },
    include: { userA: { select: person }, userB: { select: person } }
  });
  if (!t || (t.userAId !== me && t.userBId !== me)) return null;
  return t;
}

/** The person you're about to message, if the campus rule allows it. */
async function messageableUser(meId, targetId) {
  if (!targetId || targetId === meId) return { error: [400, "Pick someone to message."] };
  const [me, target] = await Promise.all([
    prisma.user.findUnique({ where: { id: meId }, select: { collegeId: true } }),
    prisma.user.findUnique({ where: { id: targetId }, select: person })
  ]);
  if (!target) return { error: [404, "That person doesn't exist."] };
  if (!me || !me.collegeId || me.collegeId !== target.collegeId) {
    return { error: [403, "You can only message people on your campus."] };
  }
  return { target };
}

// GET /api/inbox
async function listInbox(req, res) {
  const me = req.userId;

  const threads = await prisma.dmThread.findMany({
    where: { OR: [{ userAId: me }, { userBId: me }] },
    orderBy: { lastMessageAt: "desc" },
    take: 100,
    include: {
      userA: { select: person },
      userB: { select: person },
      messages: { orderBy: { createdAt: "desc" }, take: 1 }
    }
  });

  const dmUnread = await prisma.$queryRaw`
    select t.thread_id as id, count(m.dm_message_id)::int as unread
    from dm_thread t
    join dm_message m on m.thread_id = t.thread_id
    where (t.user_a_id = ${me} or t.user_b_id = ${me})
      and m.sender_id <> ${me}
      and m.created_at > coalesce(case when t.user_a_id = ${me} then t.a_last_read_at else t.b_last_read_at end, ${EPOCH})
    group by t.thread_id`;
  const dmUnreadBy = new Map(dmUnread.map((r) => [r.id, r.unread]));

  const missions = await prisma.mission.findMany({
    where: {
      missionType: { not: "solo" },
      OR: [{ createdBy: me }, { participations: { some: { userId: me, status: { in: CHAT_STATUSES } } } }]
    },
    orderBy: { datetime: "desc" },
    take: 60,
    include: {
      creator: { select: { id: true, name: true, username: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, include: { sender: { select: { name: true, username: true } } } },
      participations: { where: { status: { in: CHAT_STATUSES } }, select: { userId: true, status: true } }
    }
  });

  const missionIds = missions.map((m) => m.id);
  const missionUnread = missionIds.length
    ? await prisma.$queryRaw`
        select msg.mission_id as id, count(msg.message_id)::int as unread
        from messages msg
        left join mission_chat_read r on r.mission_id = msg.mission_id and r.user_id = ${me}
        where msg.mission_id = any(${missionIds})
          and msg.sender_id <> ${me}
          and msg.created_at > coalesce(r.last_read_at, ${EPOCH})
        group by msg.mission_id`
    : [];
  const missionUnreadBy = new Map(missionUnread.map((r) => [r.id, r.unread]));

  const conversations = [
    ...threads.map((t) => threadView(t, me, dmUnreadBy.get(t.id) || 0)),
    ...missions.map((m) => {
      const last = m.messages[0];
      const mine = m.participations.find((p) => p.userId === me);
      return {
        kind: "mission",
        key: `m:${m.id}`,
        mission_id: m.id,
        title: m.title,
        is_host: m.createdBy === me,
        mission_status: m.createdBy === me ? "Hosting" : mine ? mine.status : null,
        member_count: 1 + m.participations.filter((p) => p.userId !== m.createdBy).length,
        host: m.creator ? { id: m.creator.id, name: m.creator.name, username: m.creator.username || null } : null,
        last_message: last
          ? { id: last.id, sender_id: last.senderId, sender_name: last.sender.name, body: last.message, created_at: last.createdAt }
          : null,
        last_at: (last ? last.createdAt : m.datetime || new Date()).toISOString(),
        unread: missionUnreadBy.get(m.id) || 0
      };
    })
  ].sort((a, b) => {
    // Conversations with messages first, newest activity on top; silent
    // mission chats (no messages yet) after them.
    if (!!a.last_message !== !!b.last_message) return a.last_message ? -1 : 1;
    return a.last_at < b.last_at ? 1 : -1;
  });

  res.json({ conversations });
}

// GET /api/inbox/unread  → { count } for the nav badge
async function unreadCount(req, res) {
  const me = req.userId;
  const [dm] = await prisma.$queryRaw`
    select count(m.dm_message_id)::int as n
    from dm_thread t
    join dm_message m on m.thread_id = t.thread_id
    where (t.user_a_id = ${me} or t.user_b_id = ${me})
      and m.sender_id <> ${me}
      and m.created_at > coalesce(case when t.user_a_id = ${me} then t.a_last_read_at else t.b_last_read_at end, ${EPOCH})`;
  const [chat] = await prisma.$queryRaw`
    select count(msg.message_id)::int as n
    from messages msg
    join mission mi on mi.mission_id = msg.mission_id
    left join participation p on p.mission_id = msg.mission_id and p.user_id = ${me}
    left join mission_chat_read r on r.mission_id = msg.mission_id and r.user_id = ${me}
    where (mi.created_by = ${me} or p.status = any(${CHAT_STATUSES}))
      and msg.sender_id <> ${me}
      and msg.created_at > coalesce(r.last_read_at, ${EPOCH})`;
  res.json({ count: (dm ? dm.n : 0) + (chat ? chat.n : 0) });
}

// GET /api/inbox/people?q=  → campus people to start a conversation with
async function searchPeople(req, res) {
  const me = req.userId;
  const q = String(req.query.q || "").trim().replace(/^@/, "").slice(0, 40);
  const viewer = await prisma.user.findUnique({ where: { id: me }, select: { collegeId: true } });
  if (!viewer || !viewer.collegeId) return res.json([]);

  const where = { collegeId: viewer.collegeId, id: { not: me }, username: { not: null } };
  if (q.length >= 1) {
    where.OR = [{ name: { contains: q, mode: "insensitive" } }, { username: { contains: q.toLowerCase() } }];
  }
  const people = await prisma.user.findMany({ where, select: person, orderBy: { reputationScore: "desc" }, take: 20 });
  res.json(people.map(personView));
}

// GET /api/inbox/dm/with/:userId  → existing thread with this person, or null
async function threadWith(req, res) {
  const me = req.userId;
  const check = await messageableUser(me, toId(req.params.userId));
  if (check.error) return res.status(check.error[0]).json({ error: check.error[1] });

  const t = await prisma.dmThread.findUnique({
    where: { userAId_userBId: pair(me, check.target.id) },
    include: { userA: { select: person }, userB: { select: person }, messages: { orderBy: { createdAt: "desc" }, take: 1 } }
  });
  res.json({ other: personView(check.target), thread: t ? threadView(t, me) : null });
}

// GET /api/inbox/dm/:threadId?before=<messageId>  → thread + messages (oldest first); marks read
async function getThread(req, res) {
  const me = req.userId;
  const t = await loadThreadFor(toId(req.params.threadId), me);
  if (!t) return res.status(404).json({ error: "Conversation not found." });

  const before = toId(req.query.before);
  const page = await prisma.dmMessage.findMany({
    where: { threadId: t.id, ...(before ? { id: { lt: before } } : {}) },
    orderBy: { id: "desc" },
    take: 51
  });
  const hasMore = page.length > 50;
  const messages = page.slice(0, 50).reverse().map(dmMessageView);

  if (!before) await prisma.dmThread.update({ where: { id: t.id }, data: { [readField(t, me)]: new Date() } });

  res.json({
    thread: { ...threadView({ ...t, messages: [] }, me), last_at: t.lastMessageAt.toISOString() },
    other_last_read_at: (t.userAId === me ? t.bLastReadAt : t.aLastReadAt) || null,
    messages,
    has_more: hasMore
  });
}

/** Create or append; the request/active rules live here. */
async function deliver(me, other, threadId, body, res) {
  const rl = rateLimit(`dm:${me}`, 30, 60e3);
  if (!rl.ok) {
    res.setHeader("Retry-After", String(rl.retryAfter));
    return res.status(429).json({ error: "You're sending messages too quickly." });
  }

  let t = threadId ? await loadThreadFor(threadId, me) : null;
  if (threadId && !t) return res.status(404).json({ error: "Conversation not found." });

  if (!t) {
    const existing = await prisma.dmThread.findUnique({ where: { userAId_userBId: pair(me, other.id) } });
    if (existing) {
      t = await loadThreadFor(existing.id, me);
    } else {
      const newRl = rateLimit(`dmnew:${me}`, 20, 24 * 3600e3);
      if (!newRl.ok) return res.status(429).json({ error: "You've started a lot of new conversations today. Try again tomorrow." });
      const theyFollowMe = await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: other.id, followingId: me } },
        select: { id: true }
      });
      try {
        const created = await prisma.dmThread.create({
          data: { ...pair(me, other.id), startedBy: me, status: theyFollowMe ? "active" : "request" }
        });
        t = await loadThreadFor(created.id, me);
      } catch (error) {
        if (error.code !== "P2002") throw error; // created concurrently: use it
        const raced = await prisma.dmThread.findUnique({ where: { userAId_userBId: pair(me, other.id) } });
        t = await loadThreadFor(raced.id, me);
      }
    }
  }

  let status = t.status;
  if (status === "request") {
    if (t.startedBy === me) {
      const sent = await prisma.dmMessage.count({ where: { threadId: t.id, senderId: me } });
      if (sent >= REQUEST_MESSAGE_CAP) {
        return res.status(403).json({ error: "Wait for them to accept your request before sending more." });
      }
    } else {
      status = "active"; // replying accepts the request
    }
  }

  const now = new Date();
  const [msg] = await prisma.$transaction([
    prisma.dmMessage.create({ data: { threadId: t.id, senderId: me, body } }),
    prisma.dmThread.update({
      where: { id: t.id },
      data: { lastMessageAt: now, status, [readField(t, me)]: now }
    })
  ]);

  const recipient = otherOf(t, me);
  const sender = t.userAId === me ? t.userA : t.userB;
  await broadcast(`notifications:${recipient.id}`, "dm", {
    thread_id: t.id,
    status,
    incoming_request: status === "request",
    from: personView(sender),
    message: dmMessageView(msg)
  });

  res.status(201).json({ thread_id: t.id, status, message: dmMessageView(msg) });
}

// POST /api/inbox/dm  { toUserId, body }  → start (or continue) a conversation
async function startThread(req, res) {
  const me = req.userId;
  const body = cleanText(req.body && req.body.body, 2000);
  if (!body) return res.status(400).json({ error: "Write a message first." });
  const check = await messageableUser(me, toId(req.body && req.body.toUserId));
  if (check.error) return res.status(check.error[0]).json({ error: check.error[1] });
  return deliver(me, check.target, null, body, res);
}

// POST /api/inbox/dm/:threadId  { body }
async function sendToThread(req, res) {
  const me = req.userId;
  const body = cleanText(req.body && req.body.body, 2000);
  if (!body) return res.status(400).json({ error: "Write a message first." });
  return deliver(me, null, toId(req.params.threadId), body, res);
}

// POST /api/inbox/dm/:threadId/read
async function markThreadRead(req, res) {
  const me = req.userId;
  const t = await loadThreadFor(toId(req.params.threadId), me);
  if (!t) return res.status(404).json({ error: "Conversation not found." });
  await prisma.dmThread.update({ where: { id: t.id }, data: { [readField(t, me)]: new Date() } });
  res.json({ ok: true });
}

// POST /api/inbox/dm/:threadId/accept  (recipient of a request)
async function acceptRequest(req, res) {
  const me = req.userId;
  const t = await loadThreadFor(toId(req.params.threadId), me);
  if (!t) return res.status(404).json({ error: "Conversation not found." });
  if (t.status !== "request" || t.startedBy === me) return res.status(409).json({ error: "There's no request to accept." });
  await prisma.dmThread.update({ where: { id: t.id }, data: { status: "active" } });
  res.json({ thread_id: t.id, status: "active" });
}

// DELETE /api/inbox/dm/:threadId  (decline a request you received; removes it)
async function declineRequest(req, res) {
  const me = req.userId;
  const t = await loadThreadFor(toId(req.params.threadId), me);
  if (!t) return res.status(404).json({ error: "Conversation not found." });
  if (t.status !== "request" || t.startedBy === me) return res.status(409).json({ error: "Only requests you received can be declined." });
  await prisma.dmThread.delete({ where: { id: t.id } });
  res.json({ ok: true });
}

// POST /api/inbox/mission/:missionId/read
async function markMissionRead(req, res) {
  const me = req.userId;
  const missionId = toId(req.params.missionId);
  if (!missionId) return res.status(400).json({ error: "Invalid mission." });
  await markMissionChatRead(missionId, me);
  res.json({ ok: true });
}

async function markMissionChatRead(missionId, userId) {
  await prisma.missionChatRead.upsert({
    where: { userId_missionId: { userId, missionId } },
    update: { lastReadAt: new Date() },
    create: { userId, missionId, lastReadAt: new Date() }
  });
}

module.exports = {
  listInbox,
  unreadCount,
  searchPeople,
  threadWith,
  getThread,
  startThread,
  sendToThread,
  markThreadRead,
  acceptRequest,
  declineRequest,
  markMissionRead,
  markMissionChatRead
};
