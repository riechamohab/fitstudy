import type { Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";

import { auth } from "../auth.js";

export async function getCurrentUser(req: Request) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  return session?.user ?? null;
}

export async function requireUser(req: Request, res: Response) {
  const user = await getCurrentUser(req);

  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  return user;
}