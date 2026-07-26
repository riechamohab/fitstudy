import { Router } from "express";
import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db } from "../db/index.js";
import { focusSessions, tasks, BREAK_TYPES } from "../db/schema.js";
import { requireUser } from "../lib/auth-session.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const currentUser = await requireUser(req, res);
    if (!currentUser) return;

    const sessions = await db
      .select()
      .from(focusSessions)
      .where(eq(focusSessions.userId, currentUser.id))
      .orderBy(desc(focusSessions.startedAt))
      .limit(50);

    res.json(sessions);
  } catch (error) {
    console.error("Get focus sessions error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const currentUser = await requireUser(req, res);
    if (!currentUser) return;

    const { taskId, durationMinutes = 25 } = req.body;

    if (!taskId) {
      return res.status(400).json({ error: "taskId is required" });
    }

    const taskRows = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, currentUser.id)))
      .limit(1);

    if (!taskRows[0]) {
      return res.status(404).json({ error: "Task not found" });
    }

    const inserted = await db
      .insert(focusSessions)
      .values({
        id: nanoid(),
        userId: currentUser.id,
        taskId,
        durationMinutes: Number(durationMinutes),
      })
      .returning();

    res.status(201).json(inserted[0]);
  } catch (error) {
    console.error("Create focus session error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id/complete", async (req, res) => {
  try {
    const currentUser = await requireUser(req, res);
    if (!currentUser) return;

    const { id } = req.params;
    const { breakType } = req.body;

    if (breakType !== undefined && !BREAK_TYPES.includes(breakType)) {
      return res.status(400).json({
        error: `breakType must be one of: ${BREAK_TYPES.join(", ")}`,
      });
    }

    const existing = await db
      .select()
      .from(focusSessions)
      .where(
        and(eq(focusSessions.id, id), eq(focusSessions.userId, currentUser.id))
      )
      .limit(1);

    if (!existing[0]) {
      return res.status(404).json({ error: "Focus session not found" });
    }

    const updated = await db
      .update(focusSessions)
      .set({
        completedAt: new Date(),
        ...(breakType !== undefined && { breakType }),
      })
      .where(eq(focusSessions.id, id))
      .returning();

    res.json(updated[0]);
  } catch (error) {
    console.error("Complete focus session error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;