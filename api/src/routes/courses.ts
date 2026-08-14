import { Router } from "express";
import { and, eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db } from "../db/index.js";
import {
  courses,
  chapters,
  lessons,
  lessonProgress,
  lessonItems,
  lessonItemProgress,
  teacherPrograms,
  LESSON_STATUSES,
} from "../db/schema.js";
import { requireUser } from "../lib/auth-session.js";

const router = Router();

function isTeacherLike(role: string | undefined) {
  return role === "teacher" || role === "admin";
}

router.get("/", async (req, res) => {
  try {
    const currentUser = await requireUser(req, res);
    if (!currentUser) return;

    const studentClass = (currentUser as { studentClass?: string | null })
      .studentClass;

    const allCourses = await db.select().from(courses);

    const visibleCourses = allCourses.filter((course) => {
      if (course.creatorId === currentUser.id) return true;
      if (course.scope === "class" && studentClass && course.className === studentClass) {
        return true;
      }
      return false;
    });

    const courseIds = visibleCourses.map((c) => c.id);

    const allChapters = courseIds.length
      ? await db.select().from(chapters).where(inArray(chapters.courseId, courseIds))
      : [];

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

    const allItems = lessonIds.length
      ? await db.select().from(lessonItems).where(inArray(lessonItems.lessonId, lessonIds))
      : [];

    const itemIds = allItems.map((i) => i.id);

    const myItemProgress = itemIds.length
      ? await db
          .select()
          .from(lessonItemProgress)
          .where(
            and(
              eq(lessonItemProgress.studentId, currentUser.id),
              inArray(lessonItemProgress.itemId, itemIds)
            )
          )
      : [];

    const itemProgressByItem = new Map(myItemProgress.map((p) => [p.itemId, p]));

    function withProgress(lesson: (typeof allLessons)[number]) {
      const items = allItems
        .filter((item) => item.lessonId === lesson.id)
        .sort((a, b) => a.order - b.order)
        .map((item) => ({
          ...item,
          completed: itemProgressByItem.get(item.id)?.completed ?? false,
        }));

      if (items.length > 0) {
        const checkedCount = items.filter((i) => i.completed).length;
        const progressPercent = Math.round((checkedCount / items.length) * 100);
        const status =
          checkedCount === 0
            ? "NOT_STARTED"
            : checkedCount === items.length
            ? "COMPLETED"
            : "IN_PROGRESS";

        return { ...lesson, status, progressPercent, items };
      }

      const fallback = progressByLesson.get(lesson.id);
      return {
        ...lesson,
        status: fallback?.status ?? "NOT_STARTED",
        progressPercent: fallback?.progressPercent ?? 0,
        items: [] as typeof items,
      };
    }

    const result = visibleCourses.map((course) => {
      const courseChapters = allChapters
        .filter((ch) => ch.courseId === course.id)
        .sort((a, b) => a.order - b.order)
        .map((chapter) => ({
          ...chapter,
          lessons: allLessons
            .filter((l) => l.chapterId === chapter.id)
            .sort((a, b) => a.order - b.order)
            .map(withProgress),
        }));

      const uncategorizedLessons = allLessons
        .filter((l) => l.courseId === course.id && !l.chapterId)
        .sort((a, b) => a.order - b.order)
        .map(withProgress);

      return {
        ...course,
        isOwner: course.creatorId === currentUser.id,
        chapters: courseChapters,
        lessons: uncategorizedLessons,
      };
    });

    res.json(result);
  } catch (error) {
    console.error("Get courses error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/courses/study-program
// Haalt het vakprogramma op dat hoort bij de klas van de ingelogde student
router.get("/study-program", async (req, res) => {
  try {
    const currentUser = await requireUser(req, res);

    if (!currentUser) {
      return;
    }

    if (currentUser.role !== "student") {
      return res.status(403).json({
        error: "Alleen studenten kunnen het studieprogramma bekijken.",
      });
    }

    const studentClass = currentUser.studentClass;

    if (!studentClass) {
      return res.json({
        className: null,
        programs: [],
      });
    }

    const programs = await db
      .select()
      .from(teacherPrograms)
      .where(eq(teacherPrograms.className, studentClass));

    res.json({
      className: studentClass,
      programs,
    });
  } catch (error) {
    console.error("Get student study program error:", error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
});

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

    res.status(201).json({ ...inserted[0], isOwner: true, chapters: [], lessons: [] });
  } catch (error) {
    console.error("Create course error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

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

router.post("/:courseId/chapters", async (req, res) => {
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

    const newChapter = {
      id: nanoid(),
      courseId,
      title,
      order: Number.isFinite(Number(order)) ? Number(order) : 0,
    };

    const inserted = await db.insert(chapters).values(newChapter).returning();

    res.status(201).json({ ...inserted[0], lessons: [] });
  } catch (error) {
    console.error("Create chapter error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/chapters/:id", async (req, res) => {
  try {
    const currentUser = await requireUser(req, res);
    if (!currentUser) return;

    const { id } = req.params;
    const { title, order } = req.body;

    const chapterRows = await db.select().from(chapters).where(eq(chapters.id, id)).limit(1);
    const chapter = chapterRows[0];

    if (!chapter) {
      return res.status(404).json({ error: "Chapter not found" });
    }

    const course = await db
      .select()
      .from(courses)
      .where(eq(courses.id, chapter.courseId))
      .limit(1);

    if (!course[0] || course[0].creatorId !== currentUser.id) {
      return res.status(404).json({ error: "Chapter not found" });
    }

    const updated = await db
      .update(chapters)
      .set({
        ...(title !== undefined && { title }),
        ...(order !== undefined && { order: Number(order) }),
        updatedAt: new Date(),
      })
      .where(eq(chapters.id, id))
      .returning();

    res.json(updated[0]);
  } catch (error) {
    console.error("Update chapter error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/chapters/:id", async (req, res) => {
  try {
    const currentUser = await requireUser(req, res);
    if (!currentUser) return;

    const { id } = req.params;

    const chapterRows = await db.select().from(chapters).where(eq(chapters.id, id)).limit(1);
    const chapter = chapterRows[0];

    if (!chapter) {
      return res.status(404).json({ error: "Chapter not found" });
    }

    const course = await db
      .select()
      .from(courses)
      .where(eq(courses.id, chapter.courseId))
      .limit(1);

    if (!course[0] || course[0].creatorId !== currentUser.id) {
      return res.status(404).json({ error: "Chapter not found" });
    }

    await db.delete(chapters).where(eq(chapters.id, id));

    res.json({ message: "Chapter deleted" });
  } catch (error) {
    console.error("Delete chapter error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:courseId/lessons", async (req, res) => {
  try {
    const currentUser = await requireUser(req, res);
    if (!currentUser) return;

    const { courseId } = req.params;
    const { title, order, chapterId } = req.body;

    if (!title || typeof title !== "string") {
      return res.status(400).json({ error: "Title is required" });
    }

    const course = await db.select().from(courses).where(eq(courses.id, courseId)).limit(1);

    if (!course[0] || course[0].creatorId !== currentUser.id) {
      return res.status(404).json({ error: "Course not found" });
    }

    if (chapterId) {
      const chapterRows = await db
        .select()
        .from(chapters)
        .where(eq(chapters.id, chapterId))
        .limit(1);

      if (!chapterRows[0] || chapterRows[0].courseId !== courseId) {
        return res.status(400).json({ error: "chapterId does not belong to this course" });
      }
    }

    const newLesson = {
      id: nanoid(),
      courseId,
      chapterId: chapterId ?? null,
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

router.put("/lessons/:id", async (req, res) => {
  try {
    const currentUser = await requireUser(req, res);
    if (!currentUser) return;

    const { id } = req.params;
    const { title, order, chapterId } = req.body;

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
        ...(chapterId !== undefined && { chapterId }),
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

router.post("/lessons/:lessonId/items", async (req, res) => {
  try {
    const currentUser = await requireUser(req, res);
    if (!currentUser) return;

    const { lessonId } = req.params;
    const { title, order } = req.body;

    if (!title || typeof title !== "string") {
      return res.status(400).json({ error: "Title is required" });
    }

    const lessonRows = await db.select().from(lessons).where(eq(lessons.id, lessonId)).limit(1);
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

    const inserted = await db
      .insert(lessonItems)
      .values({
        id: nanoid(),
        lessonId,
        title,
        order: Number.isFinite(Number(order)) ? Number(order) : 0,
      })
      .returning();

    res.status(201).json({ ...inserted[0], completed: false });
  } catch (error) {
    console.error("Create lesson item error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/items/:id", async (req, res) => {
  try {
    const currentUser = await requireUser(req, res);
    if (!currentUser) return;

    const { id } = req.params;
    const { title, order } = req.body;

    const itemRows = await db.select().from(lessonItems).where(eq(lessonItems.id, id)).limit(1);
    const item = itemRows[0];

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    const lessonRows = await db
      .select()
      .from(lessons)
      .where(eq(lessons.id, item.lessonId))
      .limit(1);

    if (!lessonRows[0]) {
      return res.status(404).json({ error: "Item not found" });
    }

    const course = await db
      .select()
      .from(courses)
      .where(eq(courses.id, lessonRows[0].courseId))
      .limit(1);

    if (!course[0] || course[0].creatorId !== currentUser.id) {
      return res.status(404).json({ error: "Item not found" });
    }

    const updated = await db
      .update(lessonItems)
      .set({
        ...(title !== undefined && { title }),
        ...(order !== undefined && { order: Number(order) }),
      })
      .where(eq(lessonItems.id, id))
      .returning();

    res.json(updated[0]);
  } catch (error) {
    console.error("Update lesson item error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/items/:id", async (req, res) => {
  try {
    const currentUser = await requireUser(req, res);
    if (!currentUser) return;

    const { id } = req.params;

    const itemRows = await db.select().from(lessonItems).where(eq(lessonItems.id, id)).limit(1);
    const item = itemRows[0];

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    const lessonRows = await db
      .select()
      .from(lessons)
      .where(eq(lessons.id, item.lessonId))
      .limit(1);

    if (!lessonRows[0]) {
      return res.status(404).json({ error: "Item not found" });
    }

    const course = await db
      .select()
      .from(courses)
      .where(eq(courses.id, lessonRows[0].courseId))
      .limit(1);

    if (!course[0] || course[0].creatorId !== currentUser.id) {
      return res.status(404).json({ error: "Item not found" });
    }

    await db.delete(lessonItems).where(eq(lessonItems.id, id));

    res.json({ message: "Item deleted" });
  } catch (error) {
    console.error("Delete lesson item error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/items/:id/progress", async (req, res) => {
  try {
    const currentUser = await requireUser(req, res);
    if (!currentUser) return;

    const { id } = req.params;
    const { completed } = req.body;

    if (typeof completed !== "boolean") {
      return res.status(400).json({ error: "completed must be a boolean" });
    }

    const itemRows = await db.select().from(lessonItems).where(eq(lessonItems.id, id)).limit(1);
    const item = itemRows[0];

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    const lessonRows = await db
      .select()
      .from(lessons)
      .where(eq(lessons.id, item.lessonId))
      .limit(1);

    if (!lessonRows[0]) {
      return res.status(404).json({ error: "Item not found" });
    }

    const courseRows = await db
      .select()
      .from(courses)
      .where(eq(courses.id, lessonRows[0].courseId))
      .limit(1);
    const course = courseRows[0];

    if (!course) {
      return res.status(404).json({ error: "Item not found" });
    }

    const studentClass = (currentUser as { studentClass?: string | null }).studentClass;

    const canAccess =
      course.creatorId === currentUser.id ||
      (course.scope === "class" && studentClass && course.className === studentClass);

    if (!canAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    const existing = await db
      .select()
      .from(lessonItemProgress)
      .where(
        and(
          eq(lessonItemProgress.studentId, currentUser.id),
          eq(lessonItemProgress.itemId, id)
        )
      )
      .limit(1);

    let result;

    if (existing[0]) {
      const updated = await db
        .update(lessonItemProgress)
        .set({ completed, updatedAt: new Date() })
        .where(eq(lessonItemProgress.id, existing[0].id))
        .returning();
      result = updated[0];
    } else {
      const inserted = await db
        .insert(lessonItemProgress)
        .values({
          id: nanoid(),
          studentId: currentUser.id,
          itemId: id,
          completed,
        })
        .returning();
      result = inserted[0];
    }

    res.json(result);
  } catch (error) {
    console.error("Update lesson item progress error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

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