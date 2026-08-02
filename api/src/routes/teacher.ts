import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db } from "../db/index.js";
import { classSchedule, exercises, stressLevels, tasks, progress, teacherNotes } from "../db/schema.js";
import { user } from "../db/auth-schema.js";
import { requireUser } from "../lib/auth-session.js";

const router = Router();

async function checkTeacherRole(req: any, res: any, next: any) {
  const currentUser = await requireUser(req, res);

  if (!currentUser) {
    return;
  }

  if (currentUser.role !== "teacher" && currentUser.role !== "admin") {
    return res.status(403).json({
      error: "Access denied. Teacher role required.",
    });
  }

  req.currentUser = currentUser;

  next();
}

async function checkAdminRole(req: any, res: any, next: any) {
  const currentUser = await requireUser(req, res);

  if (!currentUser) {
    return;
  }

  if (currentUser.role !== "admin") {
    return res.status(403).json({
      error: "Access denied. Admin role required.",
    });
  }

  req.currentUser = currentUser;

  next();
}

const DAYS_OF_WEEK = [0, 1, 2, 3, 4, 5, 6];

router.get("/overview", checkTeacherRole, async (_req, res) => {
  try {
    const students = await db.select().from(user);
    const allTasks = await db.select().from(tasks);

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const activeStudentIds = new Set(
      allTasks
        .filter((task) => task.createdAt >= oneWeekAgo)
        .map((task) => task.userId)
    );

    const completedTasks = allTasks.filter(
      (task) => task.status === "COMPLETED"
    ).length;

    const avgCompletionRate =
      allTasks.length > 0
        ? Number(((completedTasks / allTasks.length) * 100).toFixed(1))
        : 0;

    res.json({
      totalStudents: students.length,
      activeStudents: activeStudentIds.size,
      totalTasks: allTasks.length,
      completedTasks,
      avgCompletionRate,
    });
  } catch (error) {
    console.error("Teacher overview error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/students", checkTeacherRole, async (_req, res) => {
  try {
    const students = await db.select().from(user);
    const allTasks = await db.select().from(tasks);
    const allExercises = await db.select().from(exercises);
    const allStressLevels = await db.select().from(stressLevels);

    const now = new Date();

    const studentsWithStats = students
      .map((student) => {
        const studentTasks = allTasks.filter(
          (task) => task.userId === student.id
        );

        const studentExercises = allExercises.filter(
          (exercise) => exercise.userId === student.id
        );

        const studentStressLevels = allStressLevels
          .filter((stress) => stress.userId === student.id)
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() -
              new Date(a.createdAt).getTime()
          );

        const completedTasks = studentTasks.filter(
          (task) => task.status === "COMPLETED"
        ).length;

        const overdueTasks = studentTasks.filter(
          (task) =>
            task.deadline !== null &&
            task.deadline < now &&
            task.status !== "COMPLETED"
        ).length;

        return {
          id: student.id,
          name: student.name,
          email: student.email,
          createdAt: student.createdAt,
          counts: {
            tasks: studentTasks.length,
            exercises: studentExercises.length,
            stressLevels: studentStressLevels.length,
          },
          completedTasks,
          overdueTasks,
          recentStressLevel: studentStressLevels[0]?.level ?? null,
          completionRate:
            studentTasks.length > 0
              ? Number(((completedTasks / studentTasks.length) * 100).toFixed(1))
              : 0,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    res.json(studentsWithStats);
  } catch (error) {
    console.error("Get students error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/students/:id/details", checkTeacherRole, async (req, res) => {
  try {
    const { id } = req.params;

    const students = await db.select().from(user).where(eq(user.id, id));
    const student = students[0];

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    const studentTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, id))
      .orderBy(desc(tasks.createdAt));

    const studentExercises = await db
      .select()
      .from(exercises)
      .where(eq(exercises.userId, id))
      .orderBy(desc(exercises.createdAt));

    const studentStressLevels = await db
      .select()
      .from(stressLevels)
      .where(eq(stressLevels.userId, id))
      .orderBy(desc(stressLevels.createdAt));

    const studentProgress = await db
      .select()
      .from(progress)
      .where(eq(progress.userId, id))
      .orderBy(desc(progress.createdAt));

    const now = new Date();

    const taskStats = {
      total: studentTasks.length,
      completed: studentTasks.filter((task) => task.status === "COMPLETED")
        .length,
      inProgress: studentTasks.filter((task) => task.status === "ONGOING")
        .length,
      overdue: studentTasks.filter(
        (task) =>
          task.deadline !== null &&
          task.deadline < now &&
          task.status !== "COMPLETED"
      ).length,
    };

    const completedExercises = studentExercises.filter(
      (exercise) => exercise.completed === true
    );

    const exerciseStats = {
      total: studentExercises.length,
      completed: completedExercises.length,
      totalMinutes: Math.floor(
        completedExercises.reduce(
          (sum, exercise) => sum + exercise.duration,
          0
        ) / 60
      ),
    };

    const stressStats =
      studentStressLevels.length > 0
        ? {
            avgLevel: Number(
              (
                studentStressLevels.reduce(
                  (sum, stress) => sum + stress.level,
                  0
                ) / studentStressLevels.length
              ).toFixed(1)
            ),
            avgFocus: Number(
              (
                studentStressLevels.reduce(
                  (sum, stress) => sum + stress.focus,
                  0
                ) / studentStressLevels.length
              ).toFixed(1)
            ),
            entries: studentStressLevels.length,
          }
        : {
            avgLevel: 0,
            avgFocus: 0,
            entries: 0,
          };

    res.json({
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        createdAt: student.createdAt,
      },
      taskStats,
      exerciseStats,
      stressStats,
      recentActivity: {
        tasks: studentTasks.slice(0, 20),
        exercises: studentExercises.slice(0, 10),
        stressLevels: studentStressLevels.slice(0, 30),
        progress: studentProgress.slice(0, 15),
      },
    });
  } catch (error) {
    console.error("Get student details error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/analytics", checkTeacherRole, async (_req, res) => {
  try {
    const students = await db.select().from(user);
    const allTasks = await db.select().from(tasks);
    const allStressLevels = await db.select().from(stressLevels);

    const atRiskStudents = students
      .map((student) => {
        const studentTasks = allTasks.filter(
          (task) => task.userId === student.id
        );

        const studentStressLevels = allStressLevels.filter(
          (stress) => stress.userId === student.id
        );

        const completedTasks = studentTasks.filter(
          (task) => task.status === "COMPLETED"
        ).length;

        const completionRate =
          studentTasks.length > 0 ? completedTasks / studentTasks.length : 0;

        const avgStress =
          studentStressLevels.length > 0
            ? studentStressLevels.reduce(
                (sum, stress) => sum + stress.level,
                0
              ) / studentStressLevels.length
            : 0;

        return {
          id: student.id,
          name: student.name,
          email: student.email,
          completionRate: Number((completionRate * 100).toFixed(1)),
          avgStress: Number(avgStress.toFixed(1)),
          atRisk: completionRate < 0.5 || avgStress > 7,
        };
      })
      .filter((student) => student.atRisk);

    res.json({ atRiskStudents });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/deadlines", checkTeacherRole, async (req, res) => {
  try {
    const filter = req.query.filter as string | undefined;
    const studentId = req.query.studentId as string | undefined;

    const allTasks = await db.select().from(tasks).orderBy(desc(tasks.createdAt));

    const now = new Date();

    let filteredTasks = allTasks.filter((task) => task.deadline !== null);

    if (studentId && studentId !== "all") {
      filteredTasks = filteredTasks.filter((task) => task.userId === studentId);
    }

    if (filter === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      filteredTasks = filteredTasks.filter(
        (task) =>
          task.deadline !== null &&
          task.deadline >= today &&
          task.deadline < tomorrow
      );
    }

    if (filter === "week") {
      const nextWeek = new Date();
      nextWeek.setDate(now.getDate() + 7);

      filteredTasks = filteredTasks.filter(
        (task) =>
          task.deadline !== null &&
          task.deadline >= now &&
          task.deadline <= nextWeek
      );
    }

    if (filter === "overdue") {
      filteredTasks = filteredTasks.filter(
        (task) =>
          task.deadline !== null &&
          task.deadline < now &&
          task.status !== "COMPLETED"
      );
    }

    filteredTasks.sort((a, b) => {
      if (!a.deadline || !b.deadline) return 0;

      return a.deadline.getTime() - b.deadline.getTime();
    });

    res.json(filteredTasks);
  } catch (error) {
    console.error("Deadlines error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/behavior-reports", checkTeacherRole, async (req, res) => {
  try {
    const period = Number(req.query.period ?? 30);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    const allTasks = await db.select().from(tasks);
    const allExercises = await db.select().from(exercises);

    const periodTasks = allTasks.filter(
      (task) => task.createdAt >= startDate
    );

    const completedTasks = periodTasks.filter(
      (task) => task.status === "COMPLETED"
    );

    const completedExercises = allExercises.filter(
      (exercise) =>
        exercise.completed === true && exercise.createdAt >= startDate
    );

    const activeStudentIds = new Set(
      periodTasks.map((task) => task.userId)
    );

    const avgCompletionRate =
      periodTasks.length > 0
        ? Math.round((completedTasks.length / periodTasks.length) * 100)
        : 0;

    const avgStudyTime =
      completedExercises.length > 0 && activeStudentIds.size > 0
        ? Math.round(
            ((completedExercises.length * 0.5) / activeStudentIds.size) * 10
          ) / 10
        : 0;

    const trends = [];

    for (let i = period - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayTasks = periodTasks.filter(
        (task) => task.createdAt >= date && task.createdAt < nextDate
      );

      const dayCompletedTasks = dayTasks.filter(
        (task) => task.status === "COMPLETED"
      );

      const dayCompletionRate =
        dayTasks.length > 0
          ? Math.round((dayCompletedTasks.length / dayTasks.length) * 100)
          : 0;

      const dayStudyTime =
        Math.round(dayCompletedTasks.length * 0.5 * 10) / 10;

      trends.push({
        date: date.toISOString().split("T")[0],
        completionRate: dayCompletionRate,
        studyTime: dayStudyTime,
      });
    }

    res.json({
      overview: {
        avgCompletionRate,
        totalTasks: periodTasks.length,
        activeStudents: activeStudentIds.size,
        avgStudyTime,
      },
      trends,
    });
  } catch (error) {
    console.error("Behavior reports error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/wellness-reports", checkTeacherRole, async (req, res) => {
  try {
    const period = Number(req.query.period ?? 30);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    const allStressLevels = await db.select().from(stressLevels);

    const periodStressLevels = allStressLevels.filter(
      (stress) => stress.createdAt >= startDate
    );

    const totalEntries = periodStressLevels.length;

    const avgStress =
      totalEntries > 0
        ? Math.round(
            (periodStressLevels.reduce(
              (sum, stress) => sum + stress.level,
              0
            ) /
              totalEntries) *
              10
          ) / 10
        : 0;

    const avgFocus =
      totalEntries > 0
        ? Math.round(
            (periodStressLevels.reduce(
              (sum, stress) => sum + stress.focus,
              0
            ) /
              totalEntries) *
              10
          ) / 10
        : 0;

    const stressByStudent = new Map<string, number[]>();

    for (const stress of periodStressLevels) {
      if (!stressByStudent.has(stress.userId)) {
        stressByStudent.set(stress.userId, []);
      }

      stressByStudent.get(stress.userId)?.push(stress.level);
    }

    let studentsAtRisk = 0;

    for (const levels of stressByStudent.values()) {
      const studentAvgStress =
        levels.reduce((sum, level) => sum + level, 0) / levels.length;

      if (studentAvgStress > 7) {
        studentsAtRisk++;
      }
    }

    const trends = [];

    for (let i = period - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayEntries = periodStressLevels.filter(
        (stress) => stress.createdAt >= date && stress.createdAt < nextDate
      );

      const dayAvgStress =
        dayEntries.length > 0
          ? Math.round(
              (dayEntries.reduce((sum, stress) => sum + stress.level, 0) /
                dayEntries.length) *
                10
            ) / 10
          : 0;

      const dayAvgFocus =
        dayEntries.length > 0
          ? Math.round(
              (dayEntries.reduce((sum, stress) => sum + stress.focus, 0) /
                dayEntries.length) *
                10
            ) / 10
          : 0;

      trends.push({
        date: date.toISOString().split("T")[0],
        avgStress: dayAvgStress,
        avgFocus: dayAvgFocus,
      });
    }

    res.json({
      summary: {
        avgStress,
        avgFocus,
        totalEntries,
        studentsAtRisk,
      },
      trends,
    });
  } catch (error) {
    console.error("Wellness reports error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/class-schedule", checkAdminRole, async (req: any, res) => {
  try {
    const teacherId = req.currentUser.id;

    const entries = await db
      .select()
      .from(classSchedule)
      .where(eq(classSchedule.teacherId, teacherId))
      .orderBy(classSchedule.dayOfWeek, classSchedule.startTime);

    res.json(entries);
  } catch (error) {
    console.error("Get class schedule error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/class-schedule", checkAdminRole, async (req: any, res) => {
  try {
    const teacherId = req.currentUser.id;

    const { className, subject, room, dayOfWeek, startTime, endTime } = req.body;

    if (!className || !subject || !startTime || !endTime) {
      return res.status(400).json({
        error: "className, subject, startTime, and endTime are required",
      });
    }

    if (!DAYS_OF_WEEK.includes(Number(dayOfWeek))) {
      return res.status(400).json({ error: "dayOfWeek must be 0-6" });
    }

    const newEntry = {
      id: nanoid(),
      teacherId,
      className,
      subject,
      room: room ?? null,
      dayOfWeek: Number(dayOfWeek),
      startTime,
      endTime,
    };

    const inserted = await db.insert(classSchedule).values(newEntry).returning();

    res.status(201).json(inserted[0]);
  } catch (error) {
    console.error("Create class schedule error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/class-schedule/:id", checkAdminRole, async (req: any, res) => {
  try {
    const teacherId = req.currentUser.id;
    const { id } = req.params;

    const { className, subject, room, dayOfWeek, startTime, endTime } = req.body;

    if (dayOfWeek !== undefined && !DAYS_OF_WEEK.includes(Number(dayOfWeek))) {
      return res.status(400).json({ error: "dayOfWeek must be 0-6" });
    }

    const existing = await db
      .select()
      .from(classSchedule)
      .where(eq(classSchedule.id, id))
      .limit(1);

    if (!existing[0] || existing[0].teacherId !== teacherId) {
      return res.status(404).json({ error: "Class schedule entry not found" });
    }

    const updated = await db
      .update(classSchedule)
      .set({
        ...(className !== undefined && { className }),
        ...(subject !== undefined && { subject }),
        ...(room !== undefined && { room }),
        ...(dayOfWeek !== undefined && { dayOfWeek: Number(dayOfWeek) }),
        ...(startTime !== undefined && { startTime }),
        ...(endTime !== undefined && { endTime }),
        updatedAt: new Date(),
      })
      .where(eq(classSchedule.id, id))
      .returning();

    res.json(updated[0]);
  } catch (error) {
    console.error("Update class schedule error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/class-schedule/:id", checkAdminRole, async (req: any, res) => {
  try {
    const teacherId = req.currentUser.id;
    const { id } = req.params;

    const existing = await db
      .select()
      .from(classSchedule)
      .where(eq(classSchedule.id, id))
      .limit(1);

    if (!existing[0] || existing[0].teacherId !== teacherId) {
      return res.status(404).json({ error: "Class schedule entry not found" });
    }

    await db.delete(classSchedule).where(eq(classSchedule.id, id));

    res.json({ message: "Class schedule entry deleted" });
  } catch (error) {
    console.error("Delete class schedule error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/notes", checkTeacherRole, async (req: any, res) => {
  try {
    const teacherId = req.currentUser.id;
    const { studentId, message } = req.body;

    if (!studentId || !message || typeof message !== "string") {
      return res.status(400).json({ error: "studentId and message are required" });
    }

    const inserted = await db
      .insert(teacherNotes)
      .values({
        id: nanoid(),
        studentId,
        teacherId,
        message,
      })
      .returning();

    res.status(201).json(inserted[0]);
  } catch (error) {
    console.error("Create note error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;