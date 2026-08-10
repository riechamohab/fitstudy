import { Router } from "express";
import { and, desc, eq, gte } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db } from "../db/index.js";
import { notifications, stressLevels } from "../db/schema.js";
import { requireUser } from "../lib/auth-session.js";
import { checkAndUnlockAchievements } from "./achievements.js";

const router = Router();

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

router.post("/", async (req, res) => {
  try {
      const currentUser = await requireUser(req, res);
  
    if (!currentUser) {
    return;
    }
  
      const userId = currentUser.id;

    const { level, focus, sleepHours, notes } = req.body;

    const stressLevel = Number(level);
    const focusLevel = Number(focus);

    if (!level || !focus) {
      return res.status(400).json({
        error: "Stress level and focus level are required",
      });
    }

    if (
      stressLevel < 1 ||
      stressLevel > 10 ||
      focusLevel < 1 ||
      focusLevel > 10
    ) {
      return res.status(400).json({
        error: "Levels must be between 1 and 10",
      });
    }

    let sleepHoursValue: number | null = null;
    if (sleepHours !== undefined && sleepHours !== null && sleepHours !== "") {
      sleepHoursValue = Number(sleepHours);
      if (Number.isNaN(sleepHoursValue) || sleepHoursValue < 0 || sleepHoursValue > 24) {
        return res.status(400).json({ error: "sleepHours must be between 0 and 24" });
      }
    }

    const existingToday = await db
      .select()
      .from(stressLevels)
      .where(
        and(
          eq(stressLevels.userId, userId),
          gte(stressLevels.createdAt, startOfToday())
        )
      );

    if (existingToday.length > 0) {
      return res.status(409).json({
        error: "Je hebt vandaag al een registratie ingevuld. Morgen kun je opnieuw registreren.",
      });
    }

    const insertedStressLevels = await db
      .insert(stressLevels)
      .values({
        id: nanoid(),
        userId,
        level: stressLevel,
        focus: focusLevel,
        sleepHours: sleepHoursValue,
        notes: notes ?? null,
      })
      .returning();

    const createdStressLevel = insertedStressLevels[0];

    if (stressLevel > 7) {
      await db.insert(notifications).values({
        id: nanoid(),
        userId,
        title: "High Stress Level Detected",
        message:
          "Your stress level is quite high. Consider taking a break or doing a relaxation exercise.",
        type: "STRESS_ALERT",
      });
    }

    res.status(201).json(createdStressLevel);

    checkAndUnlockAchievements(userId).catch(() => {});
  } catch (error) {
    console.error("Create stress level error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/", async (req, res) => {
  try {
      const currentUser = await requireUser(req, res);
  
    if (!currentUser) {
    return;
    }
  
      const userId = currentUser.id;

    const days = Number(req.query.days ?? 7);

    const result = await db
      .select()
      .from(stressLevels)
      .where(eq(stressLevels.userId, userId))
      .orderBy(desc(stressLevels.createdAt))
      .limit(days);

    res.json(result);
  } catch (error) {
    console.error("Get stress levels error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/stats", async (req, res) => {
  try {
      const currentUser = await requireUser(req, res);
  
    if (!currentUser) {
    return;
    }
  
      const userId = currentUser.id;

    const days = Number(req.query.days ?? 30);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const result = await db
      .select()
      .from(stressLevels)
      .where(
        gte(stressLevels.createdAt, startDate)
      )
      .orderBy(desc(stressLevels.createdAt));

    const userStressLevels = result.filter(
      (entry) => entry.userId === userId
    );

    if (userStressLevels.length === 0) {
      return res.json({
        avgStress: 0,
        avgFocus: 0,
        totalEntries: 0,
        trend: "stable",
      });
    }

    const avgStress =
      userStressLevels.reduce((sum, entry) => sum + entry.level, 0) /
      userStressLevels.length;

    const avgFocus =
      userStressLevels.reduce((sum, entry) => sum + entry.focus, 0) /
      userStressLevels.length;

    const midPoint = Math.floor(userStressLevels.length / 2);
    const firstHalf = userStressLevels.slice(midPoint);
    const secondHalf = userStressLevels.slice(0, midPoint);

    let trend = "stable";

    if (firstHalf.length > 0 && secondHalf.length > 0) {
      const firstHalfAvg =
        firstHalf.reduce((sum, entry) => sum + entry.level, 0) /
        firstHalf.length;

      const secondHalfAvg =
        secondHalf.reduce((sum, entry) => sum + entry.level, 0) /
        secondHalf.length;

      if (firstHalfAvg > secondHalfAvg + 1) {
        trend = "improving";
      } else if (secondHalfAvg > firstHalfAvg + 1) {
        trend = "worsening";
      }
    }

    res.json({
      avgStress: avgStress.toFixed(1),
      avgFocus: avgFocus.toFixed(1),
      totalEntries: userStressLevels.length,
      trend,
    });
  } catch (error) {
    console.error("Get stress stats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/recommendations", async (req, res) => {
  try {
      const currentUser = await requireUser(req, res);
  
    if (!currentUser) {
    return;
    }
  
      const userId = currentUser.id;

    const result = await db
      .select()
      .from(stressLevels)
      .where(eq(stressLevels.userId, userId))
      .orderBy(desc(stressLevels.createdAt))
      .limit(1);

    const latestEntry = result[0];

    if (!latestEntry) {
      return res.json({
        recommendations: [
          "Start tracking your stress levels to get personalized recommendations",
          "Try to maintain a regular sleep schedule",
          "Take regular breaks during study sessions",
        ],
      });
    }

    const recommendations: string[] = [];

    if (latestEntry.level > 7) {
      recommendations.push(
        "Your stress level is high - consider a breathing exercise"
      );
      recommendations.push("Take a 15-minute break and go for a walk");
      recommendations.push("Try progressive muscle relaxation techniques");
    } else if (latestEntry.level > 5) {
      recommendations.push("Moderate stress detected - a short break might help");
      recommendations.push("Try some light stretching");
    }

    if (latestEntry.focus < 5) {
      recommendations.push("Low focus detected - try the Pomodoro technique");
      recommendations.push("Consider changing your study environment");
      recommendations.push("Make sure you're staying hydrated");
    }

    if (recommendations.length === 0) {
      recommendations.push("Great job maintaining balance! Keep up the good work");
      recommendations.push("Continue your current study routine");
    }

    res.json({ recommendations });
  } catch (error) {
    console.error("Get recommendations error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/wellbeing-status", async (req, res) => {
  try {
    const currentUser = await requireUser(req, res);
    if (!currentUser) return;

    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const entries = await db
      .select()
      .from(stressLevels)
      .where(gte(stressLevels.createdAt, startDate));

    const userEntries = entries.filter((entry) => entry.userId === currentUser.id);

    if (userEntries.length === 0) {
      return res.json({
        status: "unknown",
        avgStress: null,
        avgSleep: null,
        entries: 0,
      });
    }

    const avgStress =
      userEntries.reduce((sum, entry) => sum + entry.level, 0) / userEntries.length;

    const sleepEntries = userEntries.filter((entry) => entry.sleepHours !== null);
    const avgSleep =
      sleepEntries.length > 0
        ? sleepEntries.reduce((sum, entry) => sum + (entry.sleepHours ?? 0), 0) /
          sleepEntries.length
        : null;

    let status: "healthy" | "at_risk" | "critical";

    if (avgStress >= 8 || (avgSleep !== null && avgSleep < 5)) {
      status = "critical";
    } else if (avgStress >= 6 || (avgSleep !== null && avgSleep < 7)) {
      status = "at_risk";
    } else {
      status = "healthy";
    }

    res.json({
      status,
      avgStress: Number(avgStress.toFixed(1)),
      avgSleep: avgSleep !== null ? Number(avgSleep.toFixed(1)) : null,
      entries: userEntries.length,
    });
  } catch (error) {
    console.error("Get wellbeing status error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;