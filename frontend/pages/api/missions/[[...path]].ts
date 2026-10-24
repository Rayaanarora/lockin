import type { NextApiRequest, NextApiResponse } from "next";
import { getAuthUser } from "../../../lib/requireAuth";
import { fail, notFound, requireSelf, segmentsOf, setParams } from "../../../lib/apiRoute";

const {
  createMission,
  getMissionFeed,
  acceptMission,
  passMission,
  getActiveMissions,
  submitAttendance,
  approveParticipant,
  getCategories,
  getCampuses,
  submitVibeCheck
} = require("../../../backend/src/controllers/missionController");
const { finishSession } = require("../../../backend/src/controllers/recapController");

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const seg = segmentsOf(req);

  try {
    // Reference data.
    if (req.method === "GET" && seg[0] === "categories") return await getCategories(req, res);
    if (req.method === "GET" && seg[0] === "campuses") return await getCampuses(req, res);

    const user = await getAuthUser(req, res);
    if (!user) return;

    if (req.method === "POST" && !seg[0]) return await createMission(req, res);
    if (req.method === "GET" && seg[0] === "feed") return await getMissionFeed(req, res);

    // Your queue only: it carries check-in codes for missions you host.
    if (req.method === "GET" && seg[0] === "active" && seg[1]) {
      if (!requireSelf(res, seg[1], user.userId)) return;
      setParams(req, { userId: seg[1] });
      return await getActiveMissions(req, res);
    }

    if (seg[0] && req.method === "POST") {
      setParams(req, { id: seg[0] });
      switch (seg[1]) {
        case "accept":
          return await acceptMission(req, res);
        case "pass":
          return await passMission(req, res);
        case "attendance":
          return await submitAttendance(req, res);
        case "finish":
          return await finishSession(req, res);
        case "vibe-check":
          return await submitVibeCheck(req, res);
        case "approve-participant":
          return await approveParticipant(req, res);
      }
    }

    return notFound(res);
  } catch (err) {
    fail(res, err, "/api/missions");
  }
}
