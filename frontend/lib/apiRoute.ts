import type { NextApiRequest, NextApiResponse } from "next";

const { sendServerError, rateLimit } = require("../backend/src/utils/security");

/** Path segments of a catch-all route: /api/x/a/b → ["a", "b"]. */
export function segmentsOf(req: NextApiRequest): string[] {
  const p = req.query.path;
  return (Array.isArray(p) ? p : p ? [p] : []).filter(Boolean);
}

/** Express-style params for the shared controllers. */
export function setParams(req: NextApiRequest, params: Record<string, string>) {
  (req as any).params = params;
}

/** 403 unless the :userId in the path is the signed-in user. */
export function requireSelf(res: NextApiResponse, pathUserId: string | undefined, sessionUserId: number | null): boolean {
  if (!sessionUserId || Number(pathUserId) !== sessionUserId) {
    res.status(403).json({ error: "You can only access your own data here." });
    return false;
  }
  return true;
}

/** Per-IP limit for unauthenticated endpoints. */
export function limitByIp(req: NextApiRequest, res: NextApiResponse, scope: string, limit: number, windowMs: number): boolean {
  const ip = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown").split(",")[0].trim();
  const r = rateLimit(`${scope}:${ip}`, limit, windowMs);
  if (!r.ok) {
    res.setHeader("Retry-After", String(r.retryAfter));
    res.status(429).json({ error: "Too many requests. Slow down." });
    return false;
  }
  return true;
}

export function fail(res: NextApiResponse, err: unknown, scope: string) {
  sendServerError(res, err, scope);
}

export const notFound = (res: NextApiResponse) => res.status(404).json({ error: "Not found." });
