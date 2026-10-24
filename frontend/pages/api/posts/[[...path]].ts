import type { NextApiRequest, NextApiResponse } from "next";
import { getAuthUser } from "../../../lib/requireAuth";
import { fail, notFound, segmentsOf, setParams } from "../../../lib/apiRoute";

const { createPost, getPostsFeed, getPostDetail, toggleReaction, addComment, deletePost } = require("../../../backend/src/controllers/postController");

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getAuthUser(req, res);
  if (!user) return;

  const seg = segmentsOf(req);
  try {
    if (req.method === "POST" && !seg[0]) return await createPost(req, res);
    if (req.method === "GET" && seg[0] === "feed") return await getPostsFeed(req, res);

    if (seg[0]) {
      setParams(req, { id: seg[0] });
      if (req.method === "GET" && !seg[1]) return await getPostDetail(req, res);
      if (req.method === "POST" && seg[1] === "react") return await toggleReaction(req, res);
      if (req.method === "POST" && seg[1] === "comments") return await addComment(req, res);
      if (req.method === "DELETE" && !seg[1]) return await deletePost(req, res);
    }
    return notFound(res);
  } catch (err) {
    fail(res, err, "/api/posts");
  }
}
