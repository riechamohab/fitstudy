import { Router } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { schedule } from "../db/schema.js";
import { user } from "../db/auth-schema.js";
import { requireAdmin } from "../lib/auth-session.js";

const router = Router();

export const DAY_VALUES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

// 0. Alle roosters ophalen (admin overzicht)
router.get("/", requireAdmin, async (_req: any, res: any) => {
  try {
    const allSchedules = await db.select().from(schedule);
    return res.json(allSchedules);
  } catch (error) {
    console.error("Get schedules error:", error);
    return res.status(500).json({ error: "Could not fetch schedules" });
  }
});

// 1. Nieuw rooster maken (admin) - los, één regel
router.post("/", requireAdmin, async (req: any, res: any) => {
  try {
    const {
      title,
      role,
      day,
      date,
      startTime,
      endTime,
      location,
      subject,
      className,
      teacherId,
    } = req.body;

    if (!DAY_VALUES.includes(day)) {
      return res.status(400).json({
        error: `day must be one of: ${DAY_VALUES.join(", ")}`,
      });
    }

    if (!className || !teacherId) {
      return res.status(400).json({
        error: "className and teacherId are required",
      });
    }

    const createdBy = req.currentUser.id;

    const newSchedule = await db
      .insert(schedule)
      .values({
        id: crypto.randomUUID(),
        title: title || subject,
        role: role || "student",
        day,
        date,
        startTime,
        endTime,
        location,
        subject,
        className,
        teacherId,
        createdBy,
      })
      .returning();

    return res.status(201).json({
      message: "Schedule created successfully",
      schedule: newSchedule[0],
    });
  } catch (error) {
    console.error("Create schedule error:", error);
    return res.status(500).json({
      error: "Could not create schedule",
    });
  }
});

// 1b. Bulk: heel weekrooster voor één klas in één keer aanmaken
router.post("/bulk", requireAdmin, async (req: any, res: any) => {
  try {
    const { className, entries } = req.body;

    if (!className || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({
        error: "className en een niet-lege entries-lijst zijn verplicht",
      });
    }

    for (const entry of entries) {
      if (!DAY_VALUES.includes(entry.day)) {
        return res.status(400).json({ error: `Ongeldige dag: ${entry.day}` });
      }
      if (!entry.subject || !entry.teacherId || !entry.startTime || !entry.endTime) {
        return res.status(400).json({
          error: "Elke regel heeft subject, teacherId, startTime en endTime nodig",
        });
      }
    }

    const createdBy = req.currentUser.id;

    const rows = entries.map((entry: any) => ({
      id: crypto.randomUUID(),
      title: entry.title || entry.subject,
      role: entry.role || "student",
      day: entry.day,
      date: entry.date ?? null,
      startTime: entry.startTime,
      endTime: entry.endTime,
      location: entry.location ?? null,
      subject: entry.subject,
      className,
      teacherId: entry.teacherId,
      createdBy,
    }));

    const inserted = await db.insert(schedule).values(rows).returning();

    return res.status(201).json({
      message: "Weekrooster succesvol aangemaakt",
      count: inserted.length,
      schedules: inserted,
    });
  } catch (error) {
    console.error("Bulk create schedule error:", error);
    return res.status(500).json({
      error: "Kon weekrooster niet aanmaken",
    });
  }
});

// 2. Docenten ophalen gefilterd op vak (voor de admin dropdown)
router.get("/teachers/by-subject", requireAdmin, async (req: any, res: any) => {
  try {
    const { subject } = req.query;

    const teachers = await db
      .select({
        id: user.id,
        name: user.name,
      })
      .from(user)
      .where(
        and(
          eq(user.role, "teacher"),
          sql`${subject} = ANY(${user.subjects})`
        )
      );

    return res.json(teachers);
  } catch (error) {
    console.error("Fout bij ophalen docenten per vak:", error);
    return res.status(500).json({ error: "Kon docenten niet ophalen" });
  }
});

// 3. Rooster verwijderen
router.delete("/:id", requireAdmin, async (req: any, res: any) => {
  try {
    await db
      .delete(schedule)
      .where(eq(schedule.id, req.params.id));

    return res.json({
      message: "Schedule deleted successfully",
    });
  } catch (error) {
    console.error("Delete schedule error:", error);
    return res.status(500).json({
      error: "Could not delete schedule",
    });
  }
});

export default router;