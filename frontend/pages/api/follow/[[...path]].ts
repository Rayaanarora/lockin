import type { NextApiRequest, NextApiResponse } from "next";
import { getAuthUser } from "../../../lib/requireAuth";
import { fail, notFound, segmentsOf, setParams } from "../../../lib/apiRoute";

const { followUser, unfollowUser, getFollowers, getFollowing, getFollowStatus } = require("../../../backend/src/controllers/followController");

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // followerId is overwritten with the session user by getAuthUser.
  const user = await getAuthUser(req, res);
  if (!user) return;

  const seg = segmentsOf(req);
  try {
    if (req.method === "POST" && !seg[0]) return await followUser(req, res);
    if (req.method === "DELETE" && !seg[0]) return await unfollowUser(req, res);
    if (req.method === "GET" && seg[0] === "status") return await getFollowStatus(req, res);
    if (req.method === "GET" && seg[0] && seg[1] === "followers") {
      setParams(req, { userId: seg[0] });
      return await getFollowers(req, res);
    }
    if (req.method === "GET" && seg[0] && seg[1] === "following") {
      setParams(req, { userId: seg[0] });
      return await getFollowing(req, res);
    }
    return notFound(res);
  } catch (err) {
    fail(res, err, "/api/follow");
  }
}
