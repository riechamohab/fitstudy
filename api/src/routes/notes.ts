import { randomUUID } from "crypto";
import { Router } from "express";
import { and, desc, eq } from "drizzle-orm";

import { db } from "../db/index.js";
import { notifications, teacherNotes } from "../db/schema.js";
import { user } from "../db/auth-schema.js";
import { requireUser } from "../lib/auth-session.js";

const router = Router();

function canSendTeacherNote(currentUser: { role?: string }) {
  return currentUser.role === "teacher" || currentUser.role === "admin";
}

router.get("/", async (req, res) => {
  try {
    const currentUser = await requireUser(req, res);
    if (!currentUser) return;

    const notes = await db
    .select({
      id: teacherNotes.id,
      studentId: teacherNotes.studentId,
      teacherId: teacherNotes.teacherId,
      message: teacherNotes.message,
      read: teacherNotes.read,
      createdAt: teacherNotes.createdAt,
      teacherName: user.name,
    })
    .from(teacherNotes)
    .leftJoin(user, eq(teacherNotes.teacherId, user.id))
    .where(eq(teacherNotes.studentId, currentUser.id))
    .orderBy(desc(teacherNotes.createdAt));

    res.json(notes);
  } catch (error) {
    console.error("Get notes error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/student", async (req, res) => {
  try {
    const currentUser = await requireUser(req, res);
    if (!currentUser) return;

    if (!canSendTeacherNote(currentUser)) {
      return res.status(403).json({
        error: "Alleen docenten of admins mogen notities versturen.",
      });
    }

    const { studentId, message } = req.body;

    if (!studentId || !message?.trim()) {
      return res.status(400).json({
        error: "Student en bericht zijn verplicht.",
      });
    }

    const student = await db
      .select({
        id: user.id,
        role: user.role,
      })
      .from(user)
      .where(and(eq(user.id, studentId), eq(user.role, "student")))
      .limit(1);

    if (!student[0]) {
      return res.status(404).json({
        error: "Student niet gevonden.",
      });
    }

    const note = await db
      .insert(teacherNotes)
      .values({
        id: randomUUID(),
        studentId,
        teacherId: currentUser.id,
        message: message.trim(),
      })
      .returning();

    await db.insert(notifications).values({
      id: randomUUID(),
      userId: studentId,
      title: "Nieuwe notitie",
      message: "Je hebt een nieuwe notitie van je docent ontvangen.",
      type: "TEACHER_NOTE",
    });

    res.status(201).json({
      message: "Notitie verstuurd.",
      note: note[0],
    });
  } catch (error) {
    console.error("Create student note error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/class", async (req, res) => {
  try {
    const currentUser = await requireUser(req, res);
    if (!currentUser) return;

    if (!canSendTeacherNote(currentUser)) {
      return res.status(403).json({
        error: "Alleen docenten of admins mogen klasmededelingen versturen.",
      });
    }

    const { className, message } = req.body;

    if (!className || !message?.trim()) {
      return res.status(400).json({
        error: "Klas en bericht zijn verplicht.",
      });
    }

    const students = await db
      .select({
        id: user.id,
      })
      .from(user)
      .where(and(eq(user.role, "student"), eq(user.studentClass, className)));

    if (students.length === 0) {
      return res.status(404).json({
        error: "Geen studenten gevonden voor deze klas.",
      });
    }

    const notesToInsert = students.map((student) => ({
      id: randomUUID(),
      studentId: student.id,
      teacherId: currentUser.id,
      message: message.trim(),
    }));

    const notificationsToInsert = students.map((student) => ({
      id: randomUUID(),
      userId: student.id,
      title: "Nieuwe klasmededeling",
      message: "Je hebt een nieuwe mededeling van je docent ontvangen.",
      type: "CLASS_NOTE",
    }));

    await db.insert(teacherNotes).values(notesToInsert);
    await db.insert(notifications).values(notificationsToInsert);

    res.status(201).json({
      message: "Klasmededeling verstuurd.",
      count: students.length,
    });
  } catch (error) {
    console.error("Create class note error:", error);
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