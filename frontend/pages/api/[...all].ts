import { NextApiRequest, NextApiResponse } from "next";
// @ts-ignore
import app from "../../backend/server";

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return app(req, res);
}
