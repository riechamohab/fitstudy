import { Router } from "express";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db } from "../db/index.js";
import { waterLogs } from "../db/schema.js";
import { requireUser } from "../lib/auth-session.js";
import { checkAndUnlockAchievements } from "./achievements.js";

const router = Router();

const DAILY_GOAL_ML = 2500;

router.post("/", async (req, res) => {
  try {
    const currentUser = await requireUser(req, res);
    if (!currentUser) return;

    const { amountMl } = req.body;

    const parsedAmount = Number(amountMl);

    if (!parsedAmount || parsedAmount <= 0) {
      return res.status(400).json({ error: "amountMl must be a positive number" });
    }

    const inserted = await db
      .insert(waterLogs)
      .values({ id: nanoid(), userId: currentUser.id, amountMl: parsedAmount })
      .returning();

    res.status(201).json(inserted[0]);

    checkAndUnlockAchievements(currentUser.id).catch(() => {});
  } catch (error) {
    console.error("Log water intake error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const currentUser = await requireUser(req, res);
    if (!currentUser) return;

    const allLogs = await db
      .select()
      .from(waterLogs)
      .where(eq(waterLogs.userId, currentUser.id));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayLogs = allLogs.filter((log) => new Date(log.createdAt) >= today);

    const todayMl = todayLogs.reduce((sum, log) => sum + log.amountMl, 0);
    const totalMl = allLogs.reduce((sum, log) => sum + log.amountMl, 0);

    res.json({
      todayMl,
      goalMl: DAILY_GOAL_ML,
      totalMl,
      todayLogCount: todayLogs.length,
    });
  } catch (error) {
    console.error("Get water intake error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;