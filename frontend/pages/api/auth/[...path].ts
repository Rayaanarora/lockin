import type { NextApiRequest, NextApiResponse } from "next";
import { getAuthUser } from "../../../lib/requireAuth";
const { checkDomain } = require("../../../backend/src/controllers/authController");
const { syncProfile } = require("../../../backend/src/controllers/authController");
const { getMe } = require("../../../backend/src/controllers/authController");
const { logout } = require("../../../backend/src/controllers/authController");

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { path } = req.query;
  const route = Array.isArray(path) ? path.join("/") : path || "";

  try {
    if (req.method === "GET" && route === "demo") {
      const prisma = require("../../../backend/src/config/db");
      let dbUser = null;
      try {
        dbUser = await prisma.user.findFirst({
          where: { id: 101 },
          include: { collegeRef: true }
        });
      } catch (e) {
        console.warn("[/api/auth/demo] DB fetch fallback:", e);
      }

      const demoData = dbUser || {
        id: 101,
        name: "Faheem",
        email: "faheem@srmist.edu.in",
        emailVerified: true,
        college: "SRM KTR",
        department: "Networking and Communications",
        reputationScore: 180,
        bio: "Building LOCKIN app. Let's meet up and execute.",
        instagram: "@faheem_comm",
        github: "faheem-git",
        interests: "Coding, Design, Other",
        collegeId: 1634
      };

      return res.json({
        id: demoData.id,
        name: demoData.name,
        email: demoData.email,
        email_verified: demoData.emailVerified,
        college: demoData.college,
        college_id: demoData.email,
        department: demoData.department,
        reputation_score: demoData.reputationScore,
        bio: demoData.bio,
        instagram: demoData.instagram,
        github: demoData.github,
        interests: demoData.interests,
        campus_id: demoData.collegeId || 1634,
        campus_name: (demoData as any).collegeRef?.shortName || demoData.college || "SRM KTR",
        verified_at: (demoData as any).verifiedAt || new Date().toISOString()
      });
    }

    if (req.method === "GET" && route === "check-domain") {
      return await checkDomain(req, res);
    }

    if (req.method === "POST" && route === "profile") {
      const user = await getAuthUser(req, res);
      if (!user) return;
      (req as any).user = user;
      (req as any).supabaseUser = user;
      return await syncProfile(req, res);
    }

    if (req.method === "GET" && route === "me") {
      const user = await getAuthUser(req, res);
      if (!user) return;
      (req as any).user = user;
      (req as any).supabaseUser = user;
      return await getMe(req, res);
    }

    if (req.method === "POST" && route === "logout") {
      const user = await getAuthUser(req, res);
      if (!user) return;
      (req as any).user = user;
      (req as any).supabaseUser = user;
      return await logout(req, res);
    }

    return res.status(404).json({ error: "Not found" });
  } catch (err: any) {
    console.error("[/api/auth]", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
