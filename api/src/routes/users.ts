import { eq } from "drizzle-orm";
import { Router } from "express";
import multer from "multer";
import path from "path";

import { auth } from "../auth.js";
import { user as authUser } from "../db/auth-schema.js";
import { db } from "../db/index.js";
import { requireUser } from "../lib/auth-session.js";

const router = Router();

// Configureer multer voor het opslaan van geüploade bestanden (bijv. in een 'uploads' map)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Zorg dat deze map bestaat in je project
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });


router.get("/profile", async (req, res) => {
  try {
    const currentUser = await requireUser(req, res);

    if (!currentUser) {
      return;
    }

    const users = await db
    .select({
      id: authUser.id,
      name: authUser.name,
      email: authUser.email,
      emailVerified: authUser.emailVerified,
      image: authUser.image,
      role: authUser.role,
      mustChangePassword: authUser.mustChangePassword,

      // Studentgegevens
      studentId: authUser.studentId,
      school: authUser.school,
      study: authUser.study,
      phoneNumber: authUser.phoneNumber,
      studentClass: authUser.studentClass,

      // Docentgegevens
      teacherId: authUser.teacherId,
      subjects: authUser.subjects,
      mentorClassName: authUser.mentorClassName,
      mentorSchoolYear: authUser.mentorSchoolYear,

      createdAt: authUser.createdAt,
      updatedAt: authUser.updatedAt,
    })
    .from(authUser)
    .where(eq(authUser.id, currentUser.id))
    .limit(1);

    const profile = users[0];


    if (!profile) {
      return res.status(404).json({
        error: "User not found",
      });
    }


    res.json(profile);


  } catch (error) {
    console.error("Get profile error:", error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
});



router.put("/profile", async (req, res) => {
  try {
    const currentUser = await requireUser(req, res);

    if (!currentUser) {
      return;
    }


    const { name } = req.body;


    if (!name || typeof name !== "string") {
      return res.status(400).json({
        error: "Name is required",
      });
    }


    const updatedUsers = await db
      .update(authUser)
      .set({
        name: name.trim(),
        updatedAt: new Date(),
      })
      .where(eq(authUser.id, currentUser.id))
      .returning({
        id: authUser.id,
        name: authUser.name,
        email: authUser.email,
        emailVerified: authUser.emailVerified,
        image: authUser.image,
        createdAt: authUser.createdAt,
        updatedAt: authUser.updatedAt,
      });


    const updatedProfile = updatedUsers[0];


    if (!updatedProfile) {
      return res.status(404).json({
        error: "User not found",
      });
    }


    res.json(updatedProfile);


  } catch (error) {
    console.error("Update profile error:", error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
});



router.post("/change-password", async (req, res) => {
  try {
    const currentUser = await requireUser(req, res);

    if (!currentUser) {
      return;
    }

    const { currentPassword, newPassword } = req.body;

    console.log("CHANGE PASSWORD BODY:", req.body);

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: "Current password and new password are required",
      });
    }

    // 1. Wachtwoord wijzigen
    await auth.api.changePassword({
      body: {
        currentPassword,
        newPassword,
      },
      headers: new Headers(req.headers as HeadersInit),
    });

    console.log("Password succesvol gewijzigd in Better Auth");

    // 2. OTP/verplichte wachtwoordwijziging uitschakelen
    await db
      .update(authUser)
      .set({
        mustChangePassword: false,
        updatedAt: new Date(),
      })
      .where(eq(authUser.id, currentUser.id));

    console.log("mustChangePassword succesvol bijgewerkt");

    return res.json({
      success: true,
      message: "Password changed successfully",
    });

  } catch (error) {
    console.error("========== CHANGE PASSWORD ERROR ==========");
    console.error(error);
    console.error("===========================================");

    return res.status(500).json({
      error: "Failed to change password",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});



router.get("/enrollment-history", async (req, res) => {
  try {
    const currentUser = await requireUser(req, res);
    if (!currentUser) return;

    res.json([]);
  } catch (error) {
    console.error("Get enrollment history error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});



router.post("/profile/picture", upload.any(), async (req, res) => {
  try {
    const currentUser = await requireUser(req, res);
    if (!currentUser) return;

    // Bij upload.any() komt het bestand in req.files[0] te staan in plaats van req.file
    const files = req.files as Express.Multer.File[];
    const file = files?.[0];

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const imagePath = `/uploads/${file.filename}`;

    // Update de database met het nieuwe afbeeldingspad
    const updatedUsers = await db
      .update(authUser)
      .set({
        image: imagePath,
        updatedAt: new Date(),
      })
      .where(eq(authUser.id, currentUser.id))
      .returning();

    const updatedProfile = updatedUsers[0];

    if (!updatedProfile) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(updatedProfile);
  } catch (error) {
    console.error("Upload profile picture error:", error);
    res.status(500).json({ error: "Failed to upload profile picture" });
  }
});



export default router;