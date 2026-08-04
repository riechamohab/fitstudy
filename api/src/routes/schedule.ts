import { eq } from "drizzle-orm";
import { Router } from "express";
import { schedule } from "../db/auth-schema.js";
import { db } from "../db/index.js";
import { requireAdmin } from "../lib/auth-session.js";

const router = Router();

console.log("Schedule route loaded");

router.get("/test", (_req, res) => {
  res.json({
    message: "Schedule route works"
  });
});

// Alle roosters ophalen
router.get("/", async (_req, res) => {
  try {
    const schedules = await db
      .select()
      .from(schedule);

    res.json(schedules);

  } catch (error) {
    console.error("Get schedule error:", error);

    res.status(500).json({
      error: "Could not fetch schedules",
    });
  }
});


// Nieuw rooster maken (admin)
router.post("/", async (req, res) => {
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
} = req.body;

const createdBy = req.currentUser!.id;

    const newSchedule = await db
      .insert(schedule)
    .values({
  id: crypto.randomUUID(),
  title,
  role,
  day,
  date,
  startTime,
  endTime,
  location,
  subject,
  createdBy,
})
      .returning();


    res.status(201).json({
      message: "Schedule created",
      schedule: newSchedule[0],
    });


  } catch (error) {
    console.error("Create schedule error:", error);

    res.status(500).json({
      error: "Could not create schedule",
    });
  }
});


// Rooster verwijderen
router.delete("/:id", requireAdmin, async (req, res) => {
  try {

    await db
      .delete(schedule)
      .where(eq(schedule.id, req.params.id));


    res.json({
      message: "Schedule deleted",
    });


  } catch (error) {

    console.error("Delete schedule error:", error);

    res.status(500).json({
      error: "Could not delete schedule",
    });
  }
});


export default router;