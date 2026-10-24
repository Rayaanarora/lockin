import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const prisma = require("../backend/src/config/db");
const { forceIdentity } = require("../backend/src/utils/security");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false, autoRefreshToken: false } })
    : null;

/**
 * Demo login is a local-development convenience only. It needs an explicit
 * opt-in and can never be enabled in a production build.
 */
export const DEMO_LOGIN_ENABLED = process.env.ENABLE_DEMO_LOGIN === "true" && process.env.NODE_ENV !== "production";
const DEMO_USER_ID = Number(process.env.DEMO_USER_ID || 101);

export interface AuthedUser {
  /** Supabase auth user id (uuid), or "demo". */
  authId: string;
  email: string;
  /** Our database user id. Null only when `profile: false` and no profile exists yet. */
  userId: number | null;
  dbUser: any | null;
}

/**
 * Authenticate the request from its Bearer token.
 *
 * - Verifies the token with Supabase and requires a confirmed email.
 * - Resolves exactly one database user (by supabase_id; links by email only
 *   when that row has never been linked to another auth account).
 * - Overwrites every identity field in body/query with the session user, so
 *   controllers can never act on behalf of someone else.
 *
 * Sends the error response itself and returns null on failure.
 */
export async function getAuthUser(
  req: NextApiRequest,
  res: NextApiResponse,
  opts: { profile?: boolean } = {}
): Promise<AuthedUser | null> {
  const requireProfile = opts.profile !== false;
  const authHeader = req.headers.authorization || "";

  if (DEMO_LOGIN_ENABLED && authHeader === "Bearer demo-token") {
    const dbUser = await prisma.user.findUnique({ where: { id: DEMO_USER_ID }, include: { collegeRef: true } });
    if (!dbUser) {
      res.status(401).json({ error: "Demo user not found. Seed the database first." });
      return null;
    }
    return attach(req, { authId: "demo", email: dbUser.email || "", userId: dbUser.id, dbUser });
  }

  if (!supabase) {
    res.status(503).json({ error: "Sign-in is not configured on this server." });
    return null;
  }

  if (!authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required." });
    return null;
  }

  const token = authHeader.slice(7).trim();
  if (!token || token.length > 4096) {
    res.status(401).json({ error: "Invalid or expired session token." });
    return null;
  }

  const { data, error } = await supabase.auth.getUser(token);
  const authUser = data?.user;
  if (error || !authUser) {
    res.status(401).json({ error: "Invalid or expired session token." });
    return null;
  }
  if (!authUser.email || !authUser.email_confirmed_at) {
    res.status(403).json({ error: "Confirm your email address before continuing." });
    return null;
  }

  const email = authUser.email.trim().toLowerCase();
  let dbUser = await prisma.user.findUnique({ where: { supabaseId: authUser.id }, include: { collegeRef: true } });

  if (!dbUser) {
    const byEmail = await prisma.user.findUnique({ where: { email }, include: { collegeRef: true } });
    if (byEmail && byEmail.supabaseId && byEmail.supabaseId !== authUser.id) {
      // That email's profile belongs to a different auth account. Never merge.
      res.status(403).json({ error: "This email is linked to another account." });
      return null;
    }
    if (byEmail && !byEmail.supabaseId) {
      dbUser = await prisma.user.update({
        where: { id: byEmail.id },
        data: { supabaseId: authUser.id, emailVerified: true, verifiedAt: byEmail.verifiedAt || new Date() },
        include: { collegeRef: true }
      });
    }
  }

  if (!dbUser && requireProfile) {
    res.status(403).json({ error: "Finish setting up your profile first." });
    return null;
  }

  return attach(req, { authId: authUser.id, email, userId: dbUser ? dbUser.id : null, dbUser });
}

function attach(req: NextApiRequest, user: AuthedUser): AuthedUser {
  const r = req as any;
  r.supabaseUser = { id: user.authId, email: user.email };
  r.user = user.dbUser;
  r.userId = user.userId;
  if (user.userId) forceIdentity(req, user.userId);
  return user;
}

export { supabase };
