import { Router } from "express";
import { desc, eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db } from "../db/index.js";
import { exercises, notifications } from "../db/schema.js";

const router = Router();

const exerciseTypes = [
  {
    type: "Breathing Exercise",
    duration: 300,
    description: "Deep breathing for relaxation",
  },
  {
    type: "Stretching",
    duration: 180,
    description: "Quick stretching routine",
  },
  {
    type: "Meditation",
    duration: 600,
    description: "Mindfulness meditation",
  },
  {
    type: "Eye Rest",
    duration: 60,
    description: "Rest your eyes from screen time",
  },
  {
    type: "Quick Walk",
    duration: 300,
    description: "Short walk to refresh",
  },
];

router.get("/", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];

    if (!userId || typeof userId !== "string") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const result = await db
      .select()
      .from(exercises)
      .where(eq(exercises.userId, userId))
      .orderBy(desc(exercises.createdAt))
      .limit(10);

    res.json(result);
  } catch (error) {
    console.error("Get exercises error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/start", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];

    if (!userId || typeof userId !== "string") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { type, duration } = req.body;

    if (!type || !duration) {
      return res.status(400).json({
        error: "Exercise type and duration are required",
      });
    }

    const durationNumber = Number(duration);

    const insertedExercises = await db
      .insert(exercises)
      .values({
        id: nanoid(),
        userId,
        type,
        duration: durationNumber,
        completed: false,
      })
      .returning();

    const exercise = insertedExercises[0];

    res.status(201).json(exercise);
  } catch (error) {
    console.error("Start exercise error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id/complete", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];

    if (!userId || typeof userId !== "string") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;

    const existingExercises = await db
      .select()
      .from(exercises)
      .where(and(eq(exercises.id, id), eq(exercises.userId, userId)))
      .limit(1);

    const exercise = existingExercises[0];

    if (!exercise) {
      return res.status(404).json({ error: "Exercise not found" });
    }

    const updatedExercises = await db
      .update(exercises)
      .set({
        completed: true,
      })
      .where(and(eq(exercises.id, id), eq(exercises.userId, userId)))
      .returning();

    const updatedExercise = updatedExercises[0];

    await db.insert(notifications).values({
      id: nanoid(),
      userId,
      title: "Exercise Completed!",
      message: `Great job! You completed your ${exercise.type} exercise.`,
      type: "EXERCISE_REMINDER",
    });

    res.json(updatedExercise);
  } catch (error) {
    console.error("Complete exercise error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/types", (_req, res) => {
  res.json(exerciseTypes);
});

router.get("/stats", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];

    if (!userId || typeof userId !== "string") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const result = await db
      .select()
      .from(exercises)
      .where(eq(exercises.userId, userId));

    const totalExercises = result.length;
    const completedExercises = result.filter(
      (exercise) => exercise.completed === true
    );

    const totalCompletedDuration = completedExercises.reduce(
      (sum, exercise) => sum + exercise.duration,
      0
    );

    res.json({
      total: totalExercises,
      completed: completedExercises.length,
      completionRate:
        totalExercises > 0
          ? ((completedExercises.length / totalExercises) * 100).toFixed(1)
          : 0,
      totalMinutes: Math.floor(totalCompletedDuration / 60),
    });
  } catch (error) {
    console.error("Exercise stats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;