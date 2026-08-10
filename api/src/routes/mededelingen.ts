import { Router } from "express";
import { randomUUID } from "crypto";
import { eq, inArray } from "drizzle-orm";

import { db } from "../db/index.js";
import { user } from "../db/auth-schema.js";
import { notifications } from "../db/schema.js";
import { requireUser } from "../lib/auth-session.js";

const router = Router();

type MededelingTarget = "students" | "teachers" | "both";
type MededelingPriority = "low" | "normal" | "high" | "urgent";

router.post("/", async (req, res) => {
  try {
    const currentUser = await requireUser(req, res);
    if (!currentUser) return;

    const [dbUser] = await db
      .select({
        id: user.id,
        role: user.role,
      })
      .from(user)
      .where(eq(user.id, currentUser.id));

    if (!dbUser || dbUser.role !== "admin") {
      return res.status(403).json({
        error: "Alleen admins mogen mededelingen versturen.",
      });
    }

    const {
      title,
      message,
      target,
      priority,
    }: {
      title?: string;
      message?: string;
      target?: MededelingTarget;
      priority?: MededelingPriority;
    } = req.body;

    if (!title || !message || !target || !priority) {
      return res.status(400).json({
        error: "Titel, bericht, doelgroep en prioriteit zijn verplicht.",
      });
    }

    const roles =
      target === "students"
        ? ["student"]
        : target === "teachers"
          ? ["teacher"]
          : ["student", "teacher"];

    const receivers = await db
      .select({
        id: user.id,
      })
      .from(user)
      .where(inArray(user.role, roles));

    if (receivers.length === 0) {
      return res.status(404).json({
        error: "Geen ontvangers gevonden.",
      });
    }

    await db.insert(notifications).values(
      receivers.map((receiver) => ({
        id: randomUUID(),
        userId: receiver.id,
        title: title.trim(),
        message: message.trim(),
        type: `MEDEDELING_${priority.toUpperCase()}`,
        read: false,
        createdAt: new Date(),
      }))
    );

    return res.status(201).json({
      success: true,
      message: "Mededeling succesvol verzonden.",
    });
  } catch (error) {
    console.error("Mededeling versturen mislukt:", error);

    return res.status(500).json({
      error: "Kon de mededeling niet versturen.",
    });
  }
});

export default router;