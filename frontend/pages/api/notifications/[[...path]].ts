import type { NextApiRequest, NextApiResponse } from "next";
import { getAuthUser } from "../../../lib/requireAuth";
import { fail, notFound, segmentsOf, setParams } from "../../../lib/apiRoute";

const { listNotifications, unreadNotifications, markRead } = require("../../../backend/src/controllers/notificationController");

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getAuthUser(req, res);
  if (!user) return;

  const seg = segmentsOf(req);
  try {
    if (req.method === "GET" && !seg[0]) return await listNotifications(req, res);
    if (req.method === "GET" && seg[0] === "unread") return await unreadNotifications(req, res);
    if (req.method === "POST" && seg[0] === "read" && !seg[1]) return await markRead(req, res);
    if (req.method === "POST" && seg[0] && seg[1] === "read") {
      setParams(req, { id: seg[0] });
      return await markRead(req, res);
    }
    return notFound(res);
  } catch (err) {
    fail(res, err, "/api/notifications");
  }
}
