/**
 * Chat media (photos, voice messages) in the private "chat" bucket.
 *
 * Clients upload straight to Supabase Storage into their own folder
 * (`<auth uid>/<uuid>.<ext>`, enforced by the storage policy in
 * supabase/chat_media.sql). Messages store only that path. The bucket is
 * private: readers get short-lived signed URLs from the server, so a file is
 * only reachable by people who can read the conversation.
 */
const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const BUCKET = "chat";
const SIGNED_TTL_SECONDS = 60 * 60 * 6;
const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const EXT = { image: "(jpg|jpeg|png|webp|gif)", voice: "(webm|m4a|mp4|ogg|mp3|aac)" };

/**
 * Validate an attachment for the sender. Returns { kind, mediaPath, mediaMeta }
 * or { error }. `authId` is the sender's Supabase auth id (their folder).
 */
function checkAttachment(kind, path, meta, authId) {
  if (kind !== "image" && kind !== "voice") return { error: "Unknown attachment type." };
  if (!authId || !/^[0-9a-f-]{36}$/i.test(String(authId))) return { error: "Sign in to send attachments." };
  const re = new RegExp(`^${String(authId).toLowerCase()}/${UUID}\\.${EXT[kind]}$`);
  const p = String(path || "").toLowerCase();
  if (!re.test(p)) return { error: "That attachment couldn't be verified. Upload it again." };

  const m = meta && typeof meta === "object" ? meta : {};
  let clean;
  if (kind === "image") {
    const w = Math.round(Number(m.width));
    const h = Math.round(Number(m.height));
    clean = w > 0 && h > 0 && w <= 10000 && h <= 10000 ? { width: w, height: h } : {};
  } else {
    const duration = Math.round(Number(m.duration) * 10) / 10;
    if (!(duration > 0 && duration <= 300)) return { error: "Voice messages can be up to 5 minutes." };
    const peaks = Array.isArray(m.peaks)
      ? m.peaks.slice(0, 64).map((v) => Math.round(Math.min(1, Math.max(0, Number(v) || 0)) * 100) / 100)
      : [];
    clean = { duration, peaks };
  }
  return { kind, mediaPath: p, mediaMeta: clean };
}

/** Sign many paths at once. Returns Map<path, signedUrl>. Missing config → empty map. */
async function signPaths(paths) {
  const unique = [...new Set(paths.filter(Boolean))];
  const out = new Map();
  if (!unique.length || !url || !serviceKey) return out;
  try {
    const r = await fetch(`${url}/storage/v1/object/sign/${BUCKET}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      body: JSON.stringify({ expiresIn: SIGNED_TTL_SECONDS, paths: unique }),
      signal: AbortSignal.timeout(4000)
    });
    if (!r.ok) {
      console.error("[media] sign failed", r.status);
      return out;
    }
    const rows = await r.json();
    for (const row of rows) {
      if (row && row.signedURL && !row.error) out.set(row.path, `${url}/storage/v1${row.signedURL}`);
    }
  } catch (err) {
    console.error("[media] sign error", err && err.message);
  }
  return out;
}

/** Short text for list previews and notifications. */
function mediaPreview(kind, body) {
  if (kind === "image") return body ? `Photo: ${body}` : "Sent a photo";
  if (kind === "voice") return "Sent a voice message";
  return body;
}

module.exports = { checkAttachment, signPaths, mediaPreview, BUCKET };
