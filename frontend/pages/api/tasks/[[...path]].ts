import type { NextApiRequest, NextApiResponse } from "next";
import { getAuthUser } from "../../../lib/requireAuth";
import { fail, notFound, segmentsOf, setParams } from "../../../lib/apiRoute";

const { getTasksForMission, createTask, createBatchTasks, toggleTask, deleteTask } = require("../../../backend/src/controllers/taskController");

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // The controller checks mission membership on every call.
  const user = await getAuthUser(req, res);
  if (!user) return;

  const seg = segmentsOf(req);
  try {
    if (req.method === "GET" && seg[0] === "mission" && seg[1]) {
      setParams(req, { missionId: seg[1] });
      return await getTasksForMission(req, res);
    }
    if (req.method === "POST" && seg[0] === "batch") return await createBatchTasks(req, res);
    if (req.method === "POST" && !seg[0]) return await createTask(req, res);
    if (req.method === "PUT" && seg[0] && seg[1] === "toggle") {
      setParams(req, { id: seg[0] });
      return await toggleTask(req, res);
    }
    if (req.method === "DELETE" && seg[0] && !seg[1]) {
      setParams(req, { id: seg[0] });
      return await deleteTask(req, res);
    }
    return notFound(res);
  } catch (err) {
    fail(res, err, "/api/tasks");
  }
}
