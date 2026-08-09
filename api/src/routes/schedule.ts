// api/src/routes/schedule.ts
import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { schedule } from "../db/schema.js";
import { user } from "../db/auth-schema.js";
import { requireAdmin } from "../lib/auth-session.js";

const router = Router();

export const DAY_VALUES = [
  "zondag",
  "maandag",
  "dinsdag",
  "woensdag",
  "donderdag",
  "vrijdag",
  "zaterdag",
] as const;

// 1. Nieuw rooster maken (admin) met vaste tijdsblokken en gekoppelde docent
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
        title,
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

// 2. Extra endpoint: Docenten ophalen gefilterd op vak (voor de admin dropdown)
router.get("/teachers/by-subject", requireAdmin, async (req: any, res: any) => {
  try {
    const { subject } = req.query;

    // Zoek docenten die gekoppeld zijn aan dit vak
    const teachers = await db
      .select({
        id: user.id,
        name: user.name,
      })
      .from(user)
      .where(and(eq(user.role, "teacher"), eq(user.study, subject as string)));

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