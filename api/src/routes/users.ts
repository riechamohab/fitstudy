import { eq } from "drizzle-orm";
import { Router } from "express";

import { auth } from "../auth.js";
import { user as authUser } from "../db/auth-schema.js";
import { db } from "../db/index.js";
import { requireUser } from "../lib/auth-session.js";

const router = Router();


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


    console.log(
      "CHANGE PASSWORD BODY:",
      req.body
    );


    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: "Current password and new password are required",
      });
    }



    await auth.api.changePassword({
      body: {
        currentPassword,
        newPassword,
      },
      headers: new Headers(
        req.headers as HeadersInit
      ),
    });



    await db
      .update(authUser)
      .set({
        mustChangePassword: false,
        updatedAt: new Date(),
      })
      .where(eq(authUser.id, currentUser.id));



    res.json({
      success: true,
      message: "Password changed successfully",
    });



  } catch (error) {
    console.error(
      "Change password error:",
      error
    );


    res.status(500).json({
      error: "Failed to change password",
    });
  }
});



export default router;