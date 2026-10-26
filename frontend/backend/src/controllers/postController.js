const prisma = require("../config/db");
const { notify } = require("../utils/notify");
const { toId, cleanText, safeImageRef } = require("../utils/security");

const EMOJIS = ["🔥", "💀", "❤️", "🧠"];
const VISIBILITIES = ["college", "followers", "everyone"];

// Public-facing author and recap fields. Never select email or auth ids.
const AUTHOR_SELECT = { id: true, name: true, department: true, college: true, collegeId: true, reputationScore: true, avatarUrl: true };
const RECAP_SELECT = { id: true, missionTitle: true, categorySnapshot: true, sessionDuration: true, tasksCompleted: true, streak: true, generatedAt: true };

function parseImageUrls(field) {
  if (!field) return [];
  try {
    const parsed = JSON.parse(field);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
  } catch {
    /* legacy single URL */
  }
  return [field];
}

function emptyReactions() {
  return { counts: { "🔥": 0, "💀": 0, "❤️": 0, "🧠": 0 }, mine: { "🔥": false, "💀": false, "❤️": false, "🧠": false } };
}

function tally(reactions, viewerId) {
  const r = emptyReactions();
  for (const x of reactions) {
    if (r.counts[x.emoji] === undefined) continue;
    r.counts[x.emoji]++;
    if (x.userId === viewerId) r.mine[x.emoji] = true;
  }
  return r;
}

function shape(post, viewerId) {
  const urls = parseImageUrls(post.imageUrl);
  const r = tally(post.reactions || [], viewerId);
  const { collegeId, ...author } = post.user || {};
  return {
    id: post.id,
    userId: post.userId,
    recapId: post.recapId,
    imageUrl: urls[0] || null,
    imageUrls: urls,
    caption: post.caption,
    visibility: post.visibility,
    createdAt: post.createdAt,
    user: author,
    recap: post.recap || null,
    commentCount: post._count ? post._count.comments : (post.comments || []).length,
    reactionCounts: r.counts,
    userReactions: r.mine
  };
}

/** Can `viewer` see `post`? Authors always; otherwise by the post's visibility. */
async function canViewPost(post, viewer) {
  if (post.userId === viewer.id) return true;
  if (post.visibility === "everyone") return true;
  if (post.visibility === "college") {
    return !!viewer.collegeId && post.user && post.user.collegeId === viewer.collegeId;
  }
  if (post.visibility === "followers") {
    const f = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: viewer.id, followingId: post.userId } },
      select: { id: true }
    });
    return !!f;
  }
  return false;
}

async function viewerOf(req) {
  return prisma.user.findUnique({ where: { id: req.userId }, select: { id: true, collegeId: true, name: true } });
}

async function loadVisiblePost(req, res, include = {}) {
  const postId = toId(req.params.id);
  if (!postId) {
    res.status(400).json({ error: "Invalid post." });
    return null;
  }
  const post = await prisma.post.findUnique({ where: { id: postId }, include: { user: { select: AUTHOR_SELECT }, ...include } });
  const viewer = await viewerOf(req);
  if (!post || !viewer || !(await canViewPost(post, viewer))) {
    res.status(404).json({ error: "Post not found." });
    return null;
  }
  return { post, viewer };
}

// POST /api/posts
async function createPost(req, res) {
  const userId = req.userId;
  const b = req.body || {};
  const visibility = VISIBILITIES.includes(b.visibility) ? b.visibility : "college";
  const caption = cleanText(b.caption, 300);

  const raw = Array.isArray(b.imageUrls) && b.imageUrls.length ? b.imageUrls : b.imageUrl ? [b.imageUrl] : [];
  if (raw.length > 4) return res.status(400).json({ error: "Up to 4 images per post." });
  const images = raw.map((u) => safeImageRef(u));
  if (images.some((u) => u === undefined)) return res.status(400).json({ error: "Images must be uploaded first." });

  let recapId = null;
  if (b.recapId) {
    recapId = toId(b.recapId);
    const recap = recapId ? await prisma.sessionRecap.findUnique({ where: { id: recapId }, select: { userId: true } }) : null;
    if (!recap || recap.userId !== userId) return res.status(403).json({ error: "You can only share your own recaps." });
  }

  if (!caption && images.length === 0 && !recapId) {
    return res.status(400).json({ error: "Add a caption, an image or a recap." });
  }

  const post = await prisma.post.create({
    data: { userId, recapId, imageUrl: images.length ? JSON.stringify(images) : null, caption, visibility },
    include: { user: { select: AUTHOR_SELECT }, recap: { select: RECAP_SELECT } }
  });
  res.status(201).json(shape({ ...post, reactions: [], comments: [] }, userId));
}

// GET /api/posts/feed
async function getPostsFeed(req, res) {
  const viewer = await viewerOf(req);
  if (!viewer) return res.status(403).json({ error: "Finish setting up your profile first." });

  const filter = req.query.filter === "following" ? "following" : "college";
  const limit = Math.min(30, Math.max(1, Number(req.query.limit) || 10));
  const cursor = toId(req.query.cursor);

  let where;
  if (filter === "following") {
    const follows = await prisma.follow.findMany({ where: { followerId: viewer.id }, select: { followingId: true } });
    const ids = follows.map((f) => f.followingId);
    // Followed people: everyone/followers posts, plus campus posts when you share their campus.
    const or = [{ userId: viewer.id }, { userId: { in: ids }, visibility: { in: ["everyone", "followers"] } }];
    if (viewer.collegeId) or.push({ userId: { in: ids }, visibility: "college", user: { collegeId: viewer.collegeId } });
    where = { OR: or };
  } else if (viewer.collegeId) {
    where = { user: { collegeId: viewer.collegeId }, visibility: { in: ["college", "everyone"] } };
  } else {
    where = { userId: viewer.id };
  }

  const posts = await prisma.post.findMany({
    where,
    take: limit,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { id: "desc" },
    include: {
      user: { select: AUTHOR_SELECT },
      recap: { select: RECAP_SELECT },
      reactions: { select: { userId: true, emoji: true } },
      _count: { select: { comments: true } }
    }
  });

  res.json({
    posts: posts.map((p) => shape(p, viewer.id)),
    nextCursor: posts.length === limit ? posts[posts.length - 1].id : null
  });
}

// GET /api/posts/:id
async function getPostDetail(req, res) {
  const found = await loadVisiblePost(req, res, {
    recap: { select: RECAP_SELECT },
    reactions: { select: { userId: true, emoji: true } },
    comments: { include: { user: { select: { id: true, name: true, department: true } } }, orderBy: { id: "asc" }, take: 200 }
  });
  if (!found) return;
  const { post, viewer } = found;
  res.json({ ...shape(post, viewer.id), comments: post.comments });
}

// POST /api/posts/:id/react
async function toggleReaction(req, res) {
  const emoji = req.body && req.body.emoji;
  if (!EMOJIS.includes(emoji)) return res.status(400).json({ error: "Unsupported reaction." });

  const found = await loadVisiblePost(req, res);
  if (!found) return;
  const { post, viewer } = found;

  const key = { userId_postId_emoji: { userId: viewer.id, postId: post.id, emoji } };
  const existing = await prisma.reaction.findUnique({ where: key });
  if (existing) await prisma.reaction.delete({ where: { id: existing.id } });
  else {
    const created = await prisma.reaction.create({ data: { userId: viewer.id, postId: post.id, emoji } }).catch((e) => {
      if (e.code !== "P2002") throw e; // double-tap race: already exists
      return null;
    });
    if (created) {
      await notify(post.userId, {
        type: "reaction",
        title: `${viewer.name || "Someone"} reacted ${emoji} to your post`,
        actorId: viewer.id,
        postId: post.id
      });
    }
  }

  const reactions = await prisma.reaction.findMany({ where: { postId: post.id }, select: { userId: true, emoji: true } });
  const r = tally(reactions, viewer.id);
  res.json({ reactionCounts: r.counts, userReactions: r.mine });
}

// POST /api/posts/:id/comments
async function addComment(req, res) {
  const text = cleanText(req.body && req.body.text, 300);
  if (!text) return res.status(400).json({ error: "Comment can't be empty." });

  const found = await loadVisiblePost(req, res);
  if (!found) return;

  const comment = await prisma.comment.create({
    data: { postId: found.post.id, userId: found.viewer.id, text },
    include: { user: { select: { id: true, name: true, department: true } } }
  });
  await notify(found.post.userId, {
    type: "comment",
    title: `${comment.user.name} commented on your post`,
    body: text.slice(0, 140),
    actorId: found.viewer.id,
    postId: found.post.id
  });
  res.status(201).json(comment);
}

// DELETE /api/posts/:id
async function deletePost(req, res) {
  const postId = toId(req.params.id);
  if (!postId) return res.status(400).json({ error: "Invalid post." });

  const post = await prisma.post.findUnique({ where: { id: postId }, select: { userId: true } });
  if (!post || post.userId !== req.userId) return res.status(404).json({ error: "Post not found." });

  await prisma.post.delete({ where: { id: postId } });
  res.json({ message: "Post deleted." });
}

module.exports = { createPost, getPostsFeed, getPostDetail, toggleReaction, addComment, deletePost };
