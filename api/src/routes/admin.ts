import { sql } from "drizzle-orm";
import { Router } from "express";

import { auth } from "../auth.js";
import { user } from "../db/auth-schema.js";
import { db } from "../db/index.js";
import { requireAdmin } from "../lib/auth-session.js";

const router = Router();

/* =========================================================
   GET ALL USERS
   ========================================================= */

router.get("/users", requireAdmin, async (_req, res) => {
  try {
    const users = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,

        // Studentgegevens
        studentId: user.studentId,
        school: user.school,
        study: user.study,
        phoneNumber: user.phoneNumber,
        studentClass: user.studentClass,
        schoolYear: user.schoolYear,
        studyHistory: user.studyHistory,

        // Docentgegevens
        teacherId: user.teacherId,
        subjects: user.subjects,
        mentorClassName: user.mentorClassName,
        mentorSchoolYear: user.mentorSchoolYear,

        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .from(user);

    res.json(users);
  } catch (error) {
    console.error("Get users error:", error);

    res.status(500).json({
      error: "Could not load users",
    });
  }
});

/* =========================================================
   CREATE USER
   ========================================================= */

router.post("/users", requireAdmin, async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,

      // Algemeen
      phoneNumber,

      // Studentgegevens
      studentId,
      school,
      study,
      studentClass,
      schoolYear,
      studyHistory,

      // Docentgegevens
      subjects,
      mentorClassName,
      mentorSchoolYear,
    } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        error: "Name, email, password and role are required",
      });
    }

    const newUser = await auth.api.signUpEmail({
      body: {
        name: name.trim(),
        email: email.trim(),
        password,
      },
    });

    const updateValues =
      role === "student"
        ? {
            role,

            studentId: studentId ?? null,
            school: school ?? null,
            study: study ?? null,
            phoneNumber: phoneNumber ?? null,
            studentClass: studentClass ?? null,
            schoolYear: schoolYear ?? null,
            studyHistory: studyHistory ?? null,

            // Niet van toepassing op studenten
            teacherId: null,
            subjects: null,
            mentorClassName: null,
            mentorSchoolYear: null,
          }
        : role === "teacher"
          ? {
              role,

              phoneNumber: phoneNumber ?? null,

              teacherId: null,

              subjects: Array.isArray(subjects)
                ? subjects
                : null,

              mentorClassName:
                mentorClassName ?? null,

              mentorSchoolYear:
                mentorSchoolYear ?? null,

              // Niet van toepassing op docenten
              studentId: null,
              school: null,
              study: null,
              studentClass: null,
              schoolYear: null,
              studyHistory: null,
            }
          : {
              role,
              phoneNumber: phoneNumber ?? null,
            };

    await db
      .update(user)
      .set(updateValues)
      .where(
        sql`${user.id} = ${newUser.user.id}`
      );

    res.status(201).json({
      message: "User created successfully",
      user: {
        ...newUser.user,
        ...updateValues,
      },
    });
    } catch (error) {
    console.error("Create user error:", error);

    res.status(500).json({
      error: "Could not create user",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/* =========================================================
   UPDATE USER
   ========================================================= */

router.put("/users/:id", requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({
        error: "User id is required",
      });
    }

    const {
      name,
      email,
      role,

      // Algemeen
      phoneNumber,

      // Studentgegevens
      studentId,
      school,
      study,
      studentClass,
      schoolYear,
      studyHistory,

      // Docentgegevens
      subjects,
      mentorClassName,
      mentorSchoolYear,
    } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({
        error: "Name, email and role are required",
      });
    }

    /*
     * STUDENT
     */
    if (role === "student") {
      const updatedUsers = await db
        .update(user)
        .set({
          name: name.trim(),
          email: email.trim(),
          role,

          studentId: studentId ?? null,
          school: school ?? null,
          study: study ?? null,
          phoneNumber: phoneNumber ?? null,
          studentClass: studentClass ?? null,
          schoolYear: schoolYear ?? null,
          studyHistory: studyHistory ?? null,

          // Docentvelden leegmaken
          teacherId: null,
          subjects: null,
          mentorClassName: null,
          mentorSchoolYear: null,

          updatedAt: new Date(),
        })
        .where(sql`${user.id} = ${id}`)
        .returning();

      if (updatedUsers.length === 0) {
        return res.status(404).json({
          error: "User not found",
        });
      }

      return res.json({
        message: "User updated successfully",
        user: updatedUsers[0],
      });
    }

    /*
     * TEACHER
     */
    if (role === "teacher") {
      const updatedUsers = await db
        .update(user)
        .set({
          name: name.trim(),
          email: email.trim(),
          role,

          // Telefoonnummer opslaan
          phoneNumber: phoneNumber ?? null,

          // Vakken opslaan als array
          subjects: Array.isArray(subjects)
            ? subjects
            : null,

          mentorClassName:
            mentorClassName ?? null,

          mentorSchoolYear:
            mentorSchoolYear ?? null,

          // Studentvelden leegmaken
          studentId: null,
          school: null,
          study: null,
          studentClass: null,
          schoolYear: null,
          studyHistory: null,

          updatedAt: new Date(),
        })
        .where(sql`${user.id} = ${id}`)
        .returning();

      if (updatedUsers.length === 0) {
        return res.status(404).json({
          error: "User not found",
        });
      }

      return res.json({
        message: "User updated successfully",
        user: updatedUsers[0],
      });
    }

    /*
     * ANDERE ROL
     */
    const updatedUsers = await db
      .update(user)
      .set({
        name: name.trim(),
        email: email.trim(),
        role,
        phoneNumber: phoneNumber ?? null,

        studentId: null,
        school: null,
        study: null,
        studentClass: null,
        schoolYear: null,
        studyHistory: null,

        teacherId: null,
        subjects: null,
        mentorClassName: null,
        mentorSchoolYear: null,

        updatedAt: new Date(),
      })
      .where(sql`${user.id} = ${id}`)
      .returning();

    if (updatedUsers.length === 0) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    return res.json({
      message: "User updated successfully",
      user: updatedUsers[0],
    });
  } catch (error) {
    console.error("Update user error:", error);

    res.status(500).json({
      error: "Could not update user",
    });
  }
});

/* =========================================================
   DELETE USER
   ========================================================= */

router.delete("/users/:id", requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({
        error: "User id is required",
      });
    }

    const deletedUsers = await db
      .delete(user)
      .where(sql`${user.id} = ${id}`)
      .returning({
        id: user.id,
      });

    if (deletedUsers.length === 0) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    res.json({
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);

    res.status(500).json({
      error: "Could not delete user",
    });
  }
});

export default router;