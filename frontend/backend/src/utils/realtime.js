/**
 * Server → client Realtime broadcasts.
 *
 * Uses Supabase's REST broadcast endpoint with the service-role key, sending
 * to PRIVATE channels. Clients can only receive on a private channel when the
 * RLS policies in supabase/security.sql allow it, and only the server (service
 * role) can send. No websocket is opened per request.
 *
 * If SUPABASE_SERVICE_ROLE_KEY is not set the broadcast is skipped (logged
 * once); the database write that triggered it has already succeeded.
 */
const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
let warned = false;

async function broadcast(topic, event, payload) {
  if (!url || !serviceKey) {
    if (!warned) {
      console.warn("[realtime] SUPABASE_SERVICE_ROLE_KEY not set; live notifications are disabled.");
      warned = true;
    }
    return;
  }
  try {
    const r = await fetch(`${url.replace(/\/$/, "")}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      body: JSON.stringify({ messages: [{ topic, event, payload, private: true }] }),
      signal: AbortSignal.timeout(3000)
    });
    if (!r.ok) console.error("[realtime] broadcast failed", r.status);
  } catch (err) {
    console.error("[realtime] broadcast error", err && err.message);
  }
}

const notifyUser = (userId, payload) => broadcast(`notifications:${Number(userId)}`, "push_notification", payload);
const notifyMissionChat = (missionId, payload) => broadcast(`mission_chat:${Number(missionId)}`, "new_message", payload);

module.exports = { broadcast, notifyUser, notifyMissionChat };
