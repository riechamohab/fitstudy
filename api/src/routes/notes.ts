import { Router } from "express";
import { and, desc, eq } from "drizzle-orm";

import { db } from "../db/index.js";
import { teacherNotes } from "../db/schema.js";
import { requireUser } from "../lib/auth-session.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const currentUser = await requireUser(req, res);
    if (!currentUser) return;

    const notes = await db
      .select()
      .from(teacherNotes)
      .where(eq(teacherNotes.studentId, currentUser.id))
      .orderBy(desc(teacherNotes.createdAt));

    res.json(notes);
  } catch (error) {
    console.error("Get notes error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id/read", async (req, res) => {
  try {
    const currentUser = await requireUser(req, res);
    if (!currentUser) return;

    const { id } = req.params;

    const existing = await db
      .select()
      .from(teacherNotes)
      .where(and(eq(teacherNotes.id, id), eq(teacherNotes.studentId, currentUser.id)))
      .limit(1);

    if (!existing[0]) {
      return res.status(404).json({ error: "Note not found" });
    }

    const updated = await db
      .update(teacherNotes)
      .set({ read: true })
      .where(eq(teacherNotes.id, id))
      .returning();

    res.json(updated[0]);
  } catch (error) {
    console.error("Mark note read error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;