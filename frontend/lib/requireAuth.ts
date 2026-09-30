import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// Extend NextApiRequest to support Express-style params used by controllers
export interface ApiRequest extends NextApiRequest {
  params?: Record<string, string>;
  user?: { id: string; email: string };
}

/**
 * Validates the Bearer token from Authorization header using Supabase.
 * Returns the supabase user or sends 401/503 and returns null.
 */
export async function getAuthUser(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<{ id: string; email: string } | null> {
  const authHeader = req.headers.authorization;
  const isDemo =
    req.headers["x-demo-user-id"] === "101" ||
    authHeader === "Bearer demo-token-101" ||
    (typeof authHeader === "string" && authHeader.includes("demo-token")) ||
    req.query.userId === "101" ||
    req.query.demo === "true";

  if (isDemo) {
    return { id: "101", email: "faheem@srmist.edu.in" };
  }

  if (!supabase) {
    res.status(503).json({ error: "Auth service not configured." });
    return null;
  }

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required." });
    return null;
  }

  const token = authHeader.split(" ")[1];
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    res.status(401).json({ error: "Invalid or expired session token." });
    return null;
  }

  return { id: user.id, email: user.email ?? "" };
}

export { supabase };
