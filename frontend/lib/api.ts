import { supabase } from "./supabase";

/** API base: same-origin /api unless an explicit remote URL is configured. */
export const API =
  process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes("localhost:4000")
    ? process.env.NEXT_PUBLIC_API_URL
    : "/api";

/** Local-development demo login. Must also be enabled on the server (ENABLE_DEMO_LOGIN). */
export const DEMO_LOGIN_ENABLED = process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === "true";

export const DEMO_KEYS = ["lockin_demo_active", "lockin_demo_user"] as const;

export function isDemoSession() {
  return DEMO_LOGIN_ENABLED && typeof window !== "undefined" && localStorage.getItem("lockin_demo_active") === "true";
}

export function clearDemoSession() {
  if (typeof window === "undefined") return;
  DEMO_KEYS.forEach((k) => localStorage.removeItem(k));
}

/**
 * Authenticated JSON request to the LOCKIN API. Identity travels only as the
 * Supabase access token; the server derives who you are from it.
 */
export async function api(path: string, options: RequestInit = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  const demo = isDemoSession();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (demo) {
    headers.Authorization = "Bearer demo-token";
  } else if (supabase) {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) headers.Authorization = `Bearer ${data.session.access_token}`;
  }

  try {
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: { ...headers, ...((options.headers as Record<string, string>) || {}) },
      signal: controller.signal
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (typeof window !== "undefined" && response.status === 401) {
        // Expired or refused session: drop it and return to sign-in.
        if (demo) clearDemoSession();
        else if (supabase) await supabase.auth.signOut().catch(() => {});
        localStorage.removeItem("lockin_user_id");
        window.location.reload();
      }
      throw new Error(data.error || "Request failed");
    }
    return data;
  } finally {
    clearTimeout(timeoutId);
  }
}
