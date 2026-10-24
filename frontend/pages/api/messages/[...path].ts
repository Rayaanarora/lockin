import type { NextApiRequest, NextApiResponse } from "next";
import { getAuthUser } from "../../../lib/requireAuth";
import { fail, notFound, segmentsOf, setParams } from "../../../lib/apiRoute";

const { getMessages, sendMessage } = require("../../../backend/src/controllers/messageController");

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getAuthUser(req, res);
  if (!user) return;

  const [missionId] = segmentsOf(req);
  if (!missionId) return notFound(res);
  setParams(req, { missionId });

  try {
    if (req.method === "GET") return await getMessages(req, res);
    if (req.method === "POST") return await sendMessage(req, res);
    return res.status(405).json({ error: "Method not allowed." });
  } catch (err) {
    fail(res, err, "/api/messages");
  }
}
