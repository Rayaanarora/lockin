import type { NextApiRequest, NextApiResponse } from "next";
import { getAuthUser } from "../../../lib/requireAuth";
import { fail, notFound, requireSelf, segmentsOf, setParams } from "../../../lib/apiRoute";

const { createUser, getUser, getLockStatus, updateUser, getLeaderboard, getUserHeat, getPublicProfile, searchUsers } = require("../../../backend/src/controllers/userController");

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getAuthUser(req, res);
  if (!user) return;

  const seg = segmentsOf(req);
  try {
    if (req.method === "GET" && seg[0] === "search") return await searchUsers(req, res);
    if (req.method === "GET" && seg[0] === "leaderboard") return await getLeaderboard(req, res);
    if (req.method === "POST" && !seg[0]) return await createUser(req, res);

    if (seg[0]) {
      setParams(req, { id: seg[0] });

      // Anyone signed in: public views.
      if (req.method === "GET" && seg[1] === "heat") return await getUserHeat(req, res);
      if (req.method === "GET" && seg[1] === "public") return await getPublicProfile(req, res);

      // Owner only.
      if (req.method === "GET" && seg[1] === "lock") {
        if (!requireSelf(res, seg[0], user.userId)) return;
        return await getLockStatus(req, res);
      }
      if (!seg[1] && (req.method === "GET" || req.method === "PUT")) {
        if (!requireSelf(res, seg[0], user.userId)) return;
        return req.method === "GET" ? await getUser(req, res) : await updateUser(req, res);
      }
    }
    return notFound(res);
  } catch (err) {
    fail(res, err, "/api/users");
  }
}
