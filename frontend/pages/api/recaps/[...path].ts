import type { NextApiRequest, NextApiResponse } from "next";
import { getAuthUser } from "../../../lib/requireAuth";
import { fail, limitByIp, notFound, requireSelf, segmentsOf, setParams } from "../../../lib/apiRoute";

const { generatePeriodRecap, getUserRecaps, getMissionRecap, getPublicShareRecap } = require("../../../backend/src/controllers/recapController");

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const seg = segmentsOf(req);

  try {
    // Public share page: no auth, rate limited, public recaps only (controller checks isPublic).
    if (req.method === "GET" && seg[0] === "share" && seg[1]) {
      if (!limitByIp(req, res, "recap-share", 30, 60e3)) return;
      if (!/^[0-9a-f-]{36}$/i.test(seg[1])) return notFound(res);
      setParams(req, { shareId: seg[1] });
      return await getPublicShareRecap(req, res);
    }

    const user = await getAuthUser(req, res);
    if (!user) return;

    if (req.method === "POST" && seg[0] === "generate") return await generatePeriodRecap(req, res);

    if (req.method === "GET" && seg[0] === "user" && seg[1]) {
      if (!requireSelf(res, seg[1], user.userId)) return;
      setParams(req, { userId: seg[1] });
      return await getUserRecaps(req, res);
    }

    if (req.method === "GET" && seg[0] === "mission" && seg[1] && seg[2] === "user" && seg[3]) {
      if (!requireSelf(res, seg[3], user.userId)) return;
      setParams(req, { missionId: seg[1], userId: seg[3] });
      return await getMissionRecap(req, res);
    }

    return notFound(res);
  } catch (err) {
    fail(res, err, "/api/recaps");
  }
}
