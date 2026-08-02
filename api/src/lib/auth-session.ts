import { fromNodeHeaders } from "better-auth/node";
import type { Request, Response } from "express";

import { auth } from "../auth.js";

export async function getCurrentUser(req: Request) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

   console.log("USER SESSION:", session?.user);
   
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

export async function requireAdmin(
  req: Request,
  res: Response,
  next: any
) {
  const user = await getCurrentUser(req);

  if (!user) {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }

  if (user.role !== "admin") {
    return res.status(403).json({
      error: "Forbidden: Admin only",
    });
  }

  req.currentUser = user;

  next();
}