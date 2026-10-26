/**
 * Server-side security helpers shared by the API routes and controllers.
 *
 * Principle: the client never decides who it is, how much Grit it has, or
 * what it is allowed to touch. Identity comes from the verified Supabase
 * session only (see frontend/lib/requireAuth.ts).
 */
const crypto = require("crypto");

/** Body/query fields that name "the acting user". Always overwritten with the session user. */
const IDENTITY_FIELDS = ["userId", "creator_id", "creatorId", "raterId", "senderId", "followerId", "viewerId", "currentUserId"];

function forceIdentity(req, userId) {
  const id = Number(userId);
  if (!req.body || typeof req.body !== "object") req.body = {};
  if (!req.query || typeof req.query !== "object") req.query = {};
  for (const f of IDENTITY_FIELDS) {
    if (f in req.body) req.body[f] = id;
    if (f in req.query) req.query[f] = String(id);
  }
  // Controllers read these two unconditionally.
  req.body.userId = id;
  req.query.userId = String(id);
}

/** Parse a positive integer id, or null. */
function toId(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** Trim and cap a string; returns null for empty. */
function cleanText(value, max) {
  if (value === undefined || value === null) return null;
  const s = String(value).replace(/\u0000/g, "").trim();
  if (!s) return null;
  return s.slice(0, max);
}

/**
 * Image/cover references must be https URLs (Supabase Storage) or one of the
 * built-in gradient presets. Data URLs, javascript:, and CSS-breaking
 * characters are rejected so nothing large or executable lands in the DB or in
 * a style attribute.
 */
const GRADIENT_PRESET = /^linear-gradient\(135deg, #[0-9a-fA-F]{6} 0%, #[0-9a-fA-F]{6} 100%\)$/;
function safeImageRef(value, { allowGradient = false } = {}) {
  if (value === undefined || value === null || value === "") return null;
  const s = String(value).trim();
  if (allowGradient && GRADIENT_PRESET.test(s)) return s;
  if (s.length > 2048) return undefined;
  let url;
  try {
    url = new URL(s);
  } catch {
    return undefined;
  }
  if (url.protocol !== "https:") return undefined;
  if (/["'()\\\s<>]/.test(s)) return undefined;
  return url.toString();
}

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
function safeColor(value) {
  if (!value) return null;
  return HEX_COLOR.test(String(value)) ? String(value) : undefined;
}

/** 4-digit check-in code from a CSPRNG. */
function newCheckInCode() {
  return String(crypto.randomInt(1000, 10000));
}

/**
 * Fixed-window rate limiter. In-memory, so on serverless it is per-instance:
 * it slows brute force from a single client but is not a global guarantee.
 */
const buckets = new Map();
function rateLimit(key, limit, windowMs) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now > b.reset) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    if (buckets.size > 10000) {
      for (const [k, v] of buckets) if (now > v.reset) buckets.delete(k);
    }
    return { ok: true, retryAfter: 0 };
  }
  b.count += 1;
  return b.count <= limit ? { ok: true, retryAfter: 0 } : { ok: false, retryAfter: Math.ceil((b.reset - now) / 1000) };
}

/** True when an error means the database is unreachable (not a bug in the query). */
function isDbConnectionError(error) {
  if (!error) return false;
  const code = typeof error.code === "string" ? error.code : "";
  if (code.startsWith("P1")) return true;
  if (["ECONNREFUSED", "ENOTFOUND", "ETIMEDOUT"].includes(code)) return true;
  const msg = String(error.message || "");
  return /Can't reach database server|Environment variable not found: DATABASE_URL|PrismaClientInitializationError/.test(msg) || error.name === "PrismaClientInitializationError";
}

/** Generic error response: details go to the server log, never to the client. */
function sendServerError(res, error, scope) {
  console.error(`[${scope}]`, error);
  if (res.headersSent) return;
  if (isDbConnectionError(error)) {
    return res.status(503).json({ error: "LOCKIN is temporarily unavailable. Try again in a moment." });
  }
  return res.status(500).json({ error: "Something went wrong. Please try again." });
}

// Usernames: Instagram-style, stored lowercase, unique (users_username_key).
const USERNAME_RE = /^[a-z0-9._]{3,20}$/;
const RESERVED_USERNAMES = new Set([
  "admin", "administrator", "lockin", "lockin.top", "support", "help", "official", "team",
  "staff", "mod", "moderator", "system", "root", "null", "undefined", "api", "inbox", "settings"
]);

/** Returns { username } when valid, or { error } with a message for the user. */
function checkUsername(value) {
  const u = String(value || "").trim().replace(/^@/, "").toLowerCase();
  if (u.length < 3) return { error: "Usernames need at least 3 characters." };
  if (u.length > 20) return { error: "Usernames can be at most 20 characters." };
  if (!USERNAME_RE.test(u)) return { error: "Use only letters, numbers, periods and underscores." };
  if (/^[._]|[._]$/.test(u) || /\.\./.test(u)) return { error: "Periods and underscores can't start, end or repeat." };
  if (/^\d+$/.test(u)) return { error: "Usernames need at least one letter." };
  if (RESERVED_USERNAMES.has(u)) return { error: "That username is reserved." };
  return { username: u };
}

module.exports = {
  checkUsername,
  IDENTITY_FIELDS,
  forceIdentity,
  toId,
  cleanText,
  safeImageRef,
  safeColor,
  newCheckInCode,
  rateLimit,
  isDbConnectionError,
  sendServerError
};
