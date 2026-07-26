import { Router } from "express";
import { and, eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db } from "../db/index.js";
import {
  courses,
  lessons,
  lessonProgress,
  LESSON_STATUSES,
} from "../db/schema.js";
import { requireUser } from "../lib/auth-session.js";

const router = Router();

function isTeacherLike(role: string | undefined) {
  return role === "teacher" || role === "admin";
}

// GET /api/courses — every course visible to the current user, with lessons + own progress
router.get("/", async (req, res) => {
  try {
    const currentUser = await requireUser(req, res);
    if (!currentUser) return;

    const studentClass = (currentUser as { studentClass?: string | null })
      .studentClass;

    const allCourses = await db.select().from(courses);

    const visibleCourses = allCourses.filter((course) => {
      if (course.creatorId === currentUser.id) return true; // own personal or own class courses
      if (course.scope === "class" && studentClass && course.className === studentClass) {
        return true;
      }
      return false;
    });

    const courseIds = visibleCourses.map((c) => c.id);

    const allLessons = courseIds.length
      ? await db.select().from(lessons).where(inArray(lessons.courseId, courseIds))
      : [];

    const lessonIds = allLessons.map((l) => l.id);

    const myProgress = lessonIds.length
      ? await db
          .select()
          .from(lessonProgress)
          .where(
            and(
              eq(lessonProgress.studentId, currentUser.id),
              inArray(lessonProgress.lessonId, lessonIds)
            )
          )
      : [];

    const progressByLesson = new Map(myProgress.map((p) => [p.lessonId, p]));

    const result = visibleCourses.map((course) => ({
      ...course,
      isOwner: course.creatorId === currentUser.id,
      lessons: allLessons
        .filter((l) => l.courseId === course.id)
        .sort((a, b) => a.order - b.order)
        .map((lesson) => {
          const progress = progressByLesson.get(lesson.id);
          return {
            ...lesson,
            status: progress?.status ?? "NOT_STARTED",
            progressPercent: progress?.progressPercent ?? 0,
          };
        }),
    }));

    res.json(result);
  } catch (error) {
    console.error("Get courses error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/courses — create a course (personal for students, class for teachers)
router.post("/", async (req, res) => {
  try {
    const currentUser = await requireUser(req, res);
    if (!currentUser) return;

    const { title, description, className } = req.body;

    if (!title || typeof title !== "string") {
      return res.status(400).json({ error: "Title is required" });
    }

    const role = (currentUser as { role?: string }).role;
    const teacherLike = isTeacherLike(role);

    if (teacherLike && !className) {
      return res.status(400).json({
        error: "className is required when creating a class course",
      });
    }

    const newCourse = {
      id: nanoid(),
      creatorId: currentUser.id,
      scope: teacherLike ? ("class" as const) : ("personal" as const),
      className: teacherLike ? className : null,
      title,
      description: description ?? null,
    };

    const inserted = await db.insert(courses).values(newCourse).returning();

    res.status(201).json({ ...inserted[0], isOwner: true, lessons: [] });
  } catch (error) {
    console.error("Create course error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/courses/:id — only the creator can edit
router.put("/:id", async (req, res) => {
  try {
    const currentUser = await requireUser(req, res);
    if (!currentUser) return;

    const { id } = req.params;
    const { title, description } = req.body;

    const existing = await db.select().from(courses).where(eq(courses.id, id)).limit(1);

    if (!existing[0] || existing[0].creatorId !== currentUser.id) {
      return res.status(404).json({ error: "Course not found" });
    }

    const updated = await db
      .update(courses)
      .set({
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        updatedAt: new Date(),
      })
      .where(eq(courses.id, id))
      .returning();

    res.json(updated[0]);
  } catch (error) {
    console.error("Update course error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/courses/:id — only the creator can delete
router.delete("/:id", async (req, res) => {
  try {
    const currentUser = await requireUser(req, res);
    if (!currentUser) return;

    const { id } = req.params;

    const existing = await db.select().from(courses).where(eq(courses.id, id)).limit(1);

    if (!existing[0] || existing[0].creatorId !== currentUser.id) {
      return res.status(404).json({ error: "Course not found" });
    }

    await db.delete(courses).where(eq(courses.id, id));

    res.json({ message: "Course deleted" });
  } catch (error) {
    console.error("Delete course error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/courses/:courseId/lessons — only the course creator can add lessons
router.post("/:courseId/lessons", async (req, res) => {
  try {
    const currentUser = await requireUser(req, res);
    if (!currentUser) return;

    const { courseId } = req.params;
    const { title, order } = req.body;

    if (!title || typeof title !== "string") {
      return res.status(400).json({ error: "Title is required" });
    }

    const course = await db.select().from(courses).where(eq(courses.id, courseId)).limit(1);

    if (!course[0] || course[0].creatorId !== currentUser.id) {
      return res.status(404).json({ error: "Course not found" });
    }

    const newLesson = {
      id: nanoid(),
      courseId,
      title,
      order: Number.isFinite(Number(order)) ? Number(order) : 0,
    };

    const inserted = await db.insert(lessons).values(newLesson).returning();

    res.status(201).json({
      ...inserted[0],
      status: "NOT_STARTED",
      progressPercent: 0,
    });
  } catch (error) {
    console.error("Create lesson error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/courses/lessons/:id — only the course creator can edit a lesson
router.put("/lessons/:id", async (req, res) => {
  try {
    const currentUser = await requireUser(req, res);
    if (!currentUser) return;

    const { id } = req.params;
    const { title, order } = req.body;

    const lessonRows = await db.select().from(lessons).where(eq(lessons.id, id)).limit(1);
    const lesson = lessonRows[0];

    if (!lesson) {
      return res.status(404).json({ error: "Lesson not found" });
    }

    const course = await db
      .select()
      .from(courses)
      .where(eq(courses.id, lesson.courseId))
      .limit(1);

    if (!course[0] || course[0].creatorId !== currentUser.id) {
      return res.status(404).json({ error: "Lesson not found" });
    }

    const updated = await db
      .update(lessons)
      .set({
        ...(title !== undefined && { title }),
        ...(order !== undefined && { order: Number(order) }),
        updatedAt: new Date(),
      })
      .where(eq(lessons.id, id))
      .returning();

    res.json(updated[0]);
  } catch (error) {
    console.error("Update lesson error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/courses/lessons/:id — only the course creator can delete a lesson
router.delete("/lessons/:id", async (req, res) => {
  try {
    const currentUser = await requireUser(req, res);
    if (!currentUser) return;

    const { id } = req.params;

    const lessonRows = await db.select().from(lessons).where(eq(lessons.id, id)).limit(1);
    const lesson = lessonRows[0];

    if (!lesson) {
      return res.status(404).json({ error: "Lesson not found" });
    }

    const course = await db
      .select()
      .from(courses)
      .where(eq(courses.id, lesson.courseId))
      .limit(1);

    if (!course[0] || course[0].creatorId !== currentUser.id) {
      return res.status(404).json({ error: "Lesson not found" });
    }

    await db.delete(lessons).where(eq(lessons.id, id));

    res.json({ message: "Lesson deleted" });
  } catch (error) {
    console.error("Delete lesson error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/courses/lessons/:id/progress — any student who can see the lesson can update their own progress
router.put("/lessons/:id/progress", async (req, res) => {
  try {
    const currentUser = await requireUser(req, res);
    if (!currentUser) return;

    const { id } = req.params;
    let { status, progressPercent } = req.body;

    if (status !== undefined && !LESSON_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `status must be one of: ${LESSON_STATUSES.join(", ")}`,
      });
    }

    const lessonRows = await db.select().from(lessons).where(eq(lessons.id, id)).limit(1);
    const lesson = lessonRows[0];

    if (!lesson) {
      return res.status(404).json({ error: "Lesson not found" });
    }

    const courseRows = await db
      .select()
      .from(courses)
      .where(eq(courses.id, lesson.courseId))
      .limit(1);
    const course = courseRows[0];

    if (!course) {
      return res.status(404).json({ error: "Lesson not found" });
    }

    const studentClass = (currentUser as { studentClass?: string | null })
      .studentClass;

    const canAccess =
      course.creatorId === currentUser.id ||
      (course.scope === "class" && studentClass && course.className === studentClass);

    if (!canAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (status === "COMPLETED" && progressPercent === undefined) {
      progressPercent = 100;
    }
    if (status === "NOT_STARTED" && progressPercent === undefined) {
      progressPercent = 0;
    }
    if (progressPercent !== undefined) {
      progressPercent = Math.max(0, Math.min(100, Number(progressPercent)));
    }

    const existing = await db
      .select()
      .from(lessonProgress)
      .where(
        and(
          eq(lessonProgress.studentId, currentUser.id),
          eq(lessonProgress.lessonId, id)
        )
      )
      .limit(1);

    let result;

    if (existing[0]) {
      const updated = await db
        .update(lessonProgress)
        .set({
          ...(status !== undefined && { status }),
          ...(progressPercent !== undefined && { progressPercent }),
          updatedAt: new Date(),
        })
        .where(eq(lessonProgress.id, existing[0].id))
        .returning();
      result = updated[0];
    } else {
      const inserted = await db
        .insert(lessonProgress)
        .values({
          id: nanoid(),
          studentId: currentUser.id,
          lessonId: id,
          status: status ?? "NOT_STARTED",
          progressPercent: progressPercent ?? 0,
        })
        .returning();
      result = inserted[0];
    }

    res.json(result);
  } catch (error) {
    console.error("Update lesson progress error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;