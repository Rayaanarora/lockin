import type { NextApiRequest, NextApiResponse } from "next";
import { getAuthUser } from "../../../lib/requireAuth";
import { fail, notFound, segmentsOf } from "../../../lib/apiRoute";

const { listColleges, searchColleges, detectCollege, getCollegeTypes } = require("../../../backend/src/controllers/collegeController");

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Needed during onboarding, before a profile exists.
  const user = await getAuthUser(req, res, { profile: false });
  if (!user) return;

  const [first] = segmentsOf(req);
  try {
    if (req.method !== "GET") return notFound(res);
    if (first === "search") return await searchColleges(req, res);
    if (first === "detect") return await detectCollege(req, res);
    if (first === "types") return await getCollegeTypes(req, res);
    if (!first) return await listColleges(req, res);
    return notFound(res);
  } catch (err) {
    fail(res, err, "/api/colleges");
  }
}
