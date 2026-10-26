import type { NextApiRequest, NextApiResponse } from "next";
import { getAuthUser } from "../../../lib/requireAuth";
import { fail, notFound, segmentsOf, setParams } from "../../../lib/apiRoute";

const inbox = require("../../../backend/src/controllers/inboxController");
const { canChat } = require("../../../backend/src/controllers/messageController");

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getAuthUser(req, res);
  if (!user) return;

  const seg = segmentsOf(req);
  const m = req.method;
  try {
    if (m === "GET" && !seg[0]) return await inbox.listInbox(req, res);
    if (m === "GET" && seg[0] === "unread") return await inbox.unreadCount(req, res);
    if (m === "GET" && seg[0] === "people") return await inbox.searchPeople(req, res);

    if (seg[0] === "dm") {
      if (m === "POST" && !seg[1]) return await inbox.startThread(req, res);
      if (m === "GET" && seg[1] === "with" && seg[2]) {
        setParams(req, { userId: seg[2] });
        return await inbox.threadWith(req, res);
      }
      if (seg[1]) {
        setParams(req, { threadId: seg[1] });
        if (m === "GET" && !seg[2]) return await inbox.getThread(req, res);
        if (m === "POST" && !seg[2]) return await inbox.sendToThread(req, res);
        if (m === "POST" && seg[2] === "read") return await inbox.markThreadRead(req, res);
        if (m === "POST" && seg[2] === "accept") return await inbox.acceptRequest(req, res);
        if (m === "DELETE" && !seg[2]) return await inbox.declineRequest(req, res);
      }
    }

    if (m === "POST" && seg[0] === "mission" && seg[1] && seg[2] === "read") {
      const missionId = Number(seg[1]);
      if (!(await canChat(missionId, user.userId))) return notFound(res);
      setParams(req, { missionId: seg[1] });
      return await inbox.markMissionRead(req, res);
    }

    return notFound(res);
  } catch (err) {
    fail(res, err, "/api/inbox");
  }
}
