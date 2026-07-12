import { Router } from "express";
import { eq } from "drizzle-orm";

import { db } from "../db/index.js";
import { user as authUser } from "../db/auth-schema.js";
import { requireUser } from "../lib/auth-session.js";

const router = Router();

router.get("/profile", async (req, res) => {
  try {
    const currentUser = await requireUser(req, res);

    if (!currentUser) {
      return;
    }

    const userId = currentUser.id;

    const users = await db
      .select({
        id: authUser.id,
        name: authUser.name,
        email: authUser.email,
        emailVerified: authUser.emailVerified,
        image: authUser.image,
        createdAt: authUser.createdAt,
        updatedAt: authUser.updatedAt,
      })
      .from(authUser)
      .where(eq(authUser.id, userId))
      .limit(1);

    const profile = users[0];

    if (!profile) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(profile);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/profile", async (req, res) => {
  try {
    const currentUser = await requireUser(req, res);

    if (!currentUser) {
      return;
    }

    const userId = currentUser.id;

    const { name } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "Name is required" });
    }

    const updatedUsers = await db
      .update(authUser)
      .set({
        name: name.trim(),
        updatedAt: new Date(),
      })
      .where(eq(authUser.id, userId))
      .returning({
        id: authUser.id,
        name: authUser.name,
        email: authUser.email,
        emailVerified: authUser.emailVerified,
        image: authUser.image,
        createdAt: authUser.createdAt,
        updatedAt: authUser.updatedAt,
      });

    const updatedProfile = updatedUsers[0];

    if (!updatedProfile) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(updatedProfile);
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;