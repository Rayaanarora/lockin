import type { NextApiRequest, NextApiResponse } from "next";
import { getAuthUser } from "../../../lib/requireAuth";
import { fail, notFound, segmentsOf, setParams } from "../../../lib/apiRoute";

const { getFeed, getLiveActivities, getUserFeed } = require("../../../backend/src/controllers/feedController");

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getAuthUser(req, res);
  if (!user) return;

  const seg = segmentsOf(req);
  try {
    if (req.method !== "GET") return notFound(res);
    if (seg[0] === "live") return await getLiveActivities(req, res);
    if (seg[0] === "user" && seg[1]) {
      setParams(req, { userId: seg[1] });
      return await getUserFeed(req, res);
    }
    if (!seg[0]) return await getFeed(req, res);
    return notFound(res);
  } catch (err) {
    fail(res, err, "/api/feed");
  }
}
