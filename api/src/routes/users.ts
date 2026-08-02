import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { randomUUID } from "node:crypto";

import { db } from "../db/index.js";
import { user as authUser } from "../db/auth-schema.js";
import { enrollmentHistory } from "../db/schema.js";
import { requireUser } from "../lib/auth-session.js";

const router = Router();

const profileColumns = {
  id: authUser.id,
  name: authUser.name,
  email: authUser.email,
  emailVerified: authUser.emailVerified,
  image: authUser.image,
  role: authUser.role,
  studentId: authUser.studentId,
  teacherId: authUser.teacherId,
  school: authUser.school,
  study: authUser.study,
  phoneNumber: authUser.phoneNumber,
  studentClass: authUser.studentClass,
  createdAt: authUser.createdAt,
  updatedAt: authUser.updatedAt,
};

router.get("/profile", async (req, res) => {
  try {
    const currentUser = await requireUser(req, res);

    if (!currentUser) {
      return;
    }

    const userId = currentUser.id;

    const users = await db
      .select(profileColumns)
      .from(authUser)
      .where(eq(authUser.id, userId))
      .limit(1);

    const profile = users[0];

    if (!profile) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(profile);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/profile", async (req, res) => {
  try {
    const currentUser = await requireUser(req, res);

    if (!currentUser) {
      return;
    }

    const userId = currentUser.id;

    const { name, school, study, phoneNumber, studentClass } = req.body;

    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ error: "Name must be a non-empty string" });
      }
      updates.name = name.trim();
    }

    if (school !== undefined) {
      if (typeof school !== "string") {
        return res.status(400).json({ error: "School must be a string" });
      }
      updates.school = school.trim();
    }

    if (study !== undefined) {
      if (typeof study !== "string") {
        return res.status(400).json({ error: "Study must be a string" });
      }
      updates.study = study.trim();
    }

    if (phoneNumber !== undefined) {
      if (typeof phoneNumber !== "string") {
        return res.status(400).json({ error: "Phone number must be a string" });
      }
      updates.phoneNumber = phoneNumber.trim();
    }

    if (studentClass !== undefined) {
      if (typeof studentClass !== "string") {
        return res.status(400).json({ error: "Class must be a string" });
      }
      updates.studentClass = studentClass.trim();
    }

    const updatedUsers = await db
      .update(authUser)
      .set(updates)
      .where(eq(authUser.id, userId))
      .returning(profileColumns);

    const updatedProfile = updatedUsers[0];

    if (!updatedProfile) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(updatedProfile);
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const uploadsDir = path.join(process.cwd(), "public", "uploads", "profile-pictures");
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `${randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image files are allowed"));
      return;
    }
    cb(null, true);
  },
});

router.post("/profile/picture", (req, res, next) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || "Upload failed" });
    }
    next();
  });
}, async (req, res) => {
  try {
    const currentUser = await requireUser(req, res);

    if (!currentUser) {
      return;
    }

    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    const imageUrl = `/uploads/profile-pictures/${req.file.filename}`;

    const updatedUsers = await db
      .update(authUser)
      .set({ image: imageUrl, updatedAt: new Date() })
      .where(eq(authUser.id, currentUser.id))
      .returning(profileColumns);

    const updatedProfile = updatedUsers[0];

    if (!updatedProfile) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(updatedProfile);
  } catch (error) {
    console.error("Upload profile picture error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/enrollment-history", async (req, res) => {
  try {
    const currentUser = await requireUser(req, res);
    if (!currentUser) return;

    const history = await db
      .select()
      .from(enrollmentHistory)
      .where(eq(enrollmentHistory.studentId, currentUser.id))
      .orderBy(desc(enrollmentHistory.schoolYear));

    res.json(history);
  } catch (error) {
    console.error("Get enrollment history error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;