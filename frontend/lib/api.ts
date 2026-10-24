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

/** Error from the API, carrying the HTTP status (0 = network failure or timeout). */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const RETRYABLE = new Set([0, 502, 503, 504]);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function accessToken(forceRefresh = false): Promise<string | null> {
  if (!supabase) return null;
  if (forceRefresh) {
    const { data } = await supabase.auth.refreshSession();
    return data.session?.access_token ?? null;
  }
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function send(path: string, options: RequestInit, token: string | null) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: { ...headers, ...((options.headers as Record<string, string>) || {}) },
      signal: controller.signal
    });
    const data = await response.json().catch(() => ({}));
    return { status: response.status, ok: response.ok, data };
  } catch {
    return { status: 0, ok: false, data: { error: "Can't reach LOCKIN. Check your connection." } };
  } finally {
    clearTimeout(timeoutId);
  }
}

let signingOut = false;

/*
 * In-flight request tracking, so the UI can show one global progress bar
 * whenever the app is waiting on the server (see components/TopLoader.tsx).
 */
let inflight = 0;
const inflightListeners = new Set<(n: number) => void>();

export function subscribeInflight(fn: (n: number) => void) {
  inflightListeners.add(fn);
  fn(inflight);
  return () => {
    inflightListeners.delete(fn);
  };
}

function setInflight(delta: number) {
  inflight = Math.max(0, inflight + delta);
  inflightListeners.forEach((fn) => fn(inflight));
}

/**
 * Authenticated JSON request to the LOCKIN API. Identity travels only as the
 * Supabase access token; the server derives who you are from it.
 *
 * - A 401 first refreshes the session and retries once; only a second 401
 *   signs the user out (a stale token after the tab slept is not a logout).
 * - Reads (GET) retry once on network failure or a 502/503/504.
 */
export async function api(path: string, options: RequestInit = {}) {
  setInflight(1);
  try {
    return await request(path, options);
  } finally {
    setInflight(-1);
  }
}

async function request(path: string, options: RequestInit) {
  const demo = isDemoSession();
  const method = (options.method || "GET").toUpperCase();
  let token = demo ? "demo-token" : await accessToken();

  let res = await send(path, options, token);

  if (res.status === 401 && !demo && supabase) {
    token = await accessToken(true);
    if (token) res = await send(path, options, token);
  }

  if (!res.ok && method === "GET" && RETRYABLE.has(res.status)) {
    await sleep(700);
    res = await send(path, options, token);
  }

  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined" && !signingOut) {
      // Session is really gone: drop it and return to sign-in.
      signingOut = true;
      if (demo) clearDemoSession();
      else if (supabase) await supabase.auth.signOut().catch(() => {});
      localStorage.removeItem("lockin_user_id");
      window.location.reload();
    }
    throw new ApiError(res.data?.error || "Something went wrong. Please try again.", res.status);
  }
  return res.data;
}
