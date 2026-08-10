import { Router } from "express";
import { and, desc, eq, gte } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db } from "../db/index.js";
import { wellbeingQuizResponses } from "../db/schema.js";
import { requireUser } from "../lib/auth-session.js";

const router = Router();

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

router.post("/", async (req, res) => {
  try {
    const currentUser = await requireUser(req, res);
    if (!currentUser) return;

    const { answers } = req.body;

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: "answers is required and must be a non-empty array" });
    }

    const existingToday = await db
      .select()
      .from(wellbeingQuizResponses)
      .where(
        and(
          eq(wellbeingQuizResponses.userId, currentUser.id),
          gte(wellbeingQuizResponses.createdAt, startOfToday())
        )
      );

    if (existingToday.length > 0) {
      return res.status(409).json({
        error: "Je hebt de quiz vandaag al ingevuld. Morgen kun je opnieuw meedoen.",
      });
    }

    const inserted = await db
      .insert(wellbeingQuizResponses)
      .values({
        id: nanoid(),
        userId: currentUser.id,
        answers,
      })
      .returning();

    res.status(201).json(inserted[0]);
  } catch (error) {
    console.error("Save quiz response error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const currentUser = await requireUser(req, res);
    if (!currentUser) return;

    const responses = await db
      .select()
      .from(wellbeingQuizResponses)
      .where(eq(wellbeingQuizResponses.userId, currentUser.id))
      .orderBy(desc(wellbeingQuizResponses.createdAt))
      .limit(20);

    res.json(responses);
  } catch (error) {
    console.error("Get quiz responses error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;