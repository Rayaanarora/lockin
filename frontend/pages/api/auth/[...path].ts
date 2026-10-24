import type { NextApiRequest, NextApiResponse } from "next";
import { DEMO_LOGIN_ENABLED, getAuthUser } from "../../../lib/requireAuth";
import { fail, limitByIp, notFound, segmentsOf } from "../../../lib/apiRoute";

const { checkDomain, syncProfile, getMe, logout } = require("../../../backend/src/controllers/authController");

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const route = segmentsOf(req).join("/");

  try {
    // Local development only: hidden entirely unless ENABLE_DEMO_LOGIN=true outside production.
    if (req.method === "GET" && route === "demo") {
      if (!DEMO_LOGIN_ENABLED) return notFound(res);
      req.headers.authorization = "Bearer demo-token";
      const user = await getAuthUser(req, res, { profile: false });
      if (!user) return;
      return await getMe(req, res);
    }

    if (req.method === "GET" && route === "check-domain") {
      if (!limitByIp(req, res, "check-domain", 30, 60e3)) return;
      return await checkDomain(req, res);
    }

    if (req.method === "POST" && route === "profile") {
      if (!limitByIp(req, res, "auth-profile", 20, 60e3)) return;
      const user = await getAuthUser(req, res, { profile: false });
      if (!user) return;
      return await syncProfile(req, res);
    }

    if (req.method === "GET" && route === "me") {
      const user = await getAuthUser(req, res, { profile: false });
      if (!user) return;
      return await getMe(req, res);
    }

    if (req.method === "POST" && route === "logout") {
      return await logout(req, res);
    }

    return notFound(res);
  } catch (err) {
    fail(res, err, "/api/auth");
  }
}
