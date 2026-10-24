import type { NextApiRequest, NextApiResponse } from "next";
import { getAuthUser } from "../../../lib/requireAuth";
import { fail, notFound, requireSelf, segmentsOf, setParams } from "../../../lib/apiRoute";

const { getInterestCategories, saveInterests, getUserInterests, updateUserInterests } = require("../../../backend/src/controllers/interestController");

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const seg = segmentsOf(req);

  try {
    // Reference data, needed before sign-up completes.
    if (req.method === "GET" && seg[0] === "categories") return await getInterestCategories(req, res);

    const user = await getAuthUser(req, res);
    if (!user) return;

    if (req.method === "POST" && !seg[0]) return await saveInterests(req, res);
    if (req.method === "GET" && seg[0]) {
      setParams(req, { userId: seg[0] });
      return await getUserInterests(req, res);
    }
    if (req.method === "PUT" && seg[0]) {
      if (!requireSelf(res, seg[0], user.userId)) return;
      setParams(req, { userId: seg[0] });
      return await updateUserInterests(req, res);
    }
    return notFound(res);
  } catch (err) {
    fail(res, err, "/api/interests");
  }
}
