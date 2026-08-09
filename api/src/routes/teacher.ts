import { Router } from "express";
import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db } from "../db/index.js";
import { teacherPrograms, exercises, stressLevels, tasks, progress, teacherNotes, notifications, schedule, grades } from "../db/schema.js";
import { user } from "../db/auth-schema.js";
import { requireUser } from "../lib/auth-session.js";

const router = Router();

// Strenge check: Alleen docenten krijgen toegang (geen admins)
async function checkTeacherRole(req: any, res: any, next: any) {
  const currentUser = await requireUser(req, res);

  if (!currentUser) {
    return;
  }

  if (currentUser.role !== "teacher") {
    return res.status(403).json({
      error: "Access denied. Teacher role required.",
    });
  }

  req.currentUser = currentUser;

  next();
}

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
    const allUsers = await db.select().from(user);
    const students = allUsers.filter((u) => u.role === "student");
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
          className: student.studentClass,
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

    const studentGrades = await db
      .select()
      .from(grades)
      .where(eq(grades.studentId, id))
      .orderBy(desc(grades.gradedAt));

    res.json({
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        className: student.studentClass,
        createdAt: student.createdAt,
      },
      taskStats,
      exerciseStats,
      stressStats,
      grades: studentGrades,
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

const ANNOUNCEMENT_TYPES = ["CLASS_CANCELED", "CLASS_MOVED", "TEST_ANNOUNCEMENT", "GENERAL"];

router.post("/announce", checkTeacherRole, async (req: any, res) => {
  try {
    const { className, title, message, type = "GENERAL" } = req.body;

    if (!className || !title || !message) {
      return res.status(400).json({ error: "className, title, and message are required" });
    }

    if (!ANNOUNCEMENT_TYPES.includes(type)) {
      return res.status(400).json({
        error: `type must be one of: ${ANNOUNCEMENT_TYPES.join(", ")}`,
      });
    }

    const students = await db.select().from(user).where(eq(user.studentClass, className));

    if (students.length === 0) {
      return res.status(404).json({ error: "No students found in that class" });
    }

    await db.insert(notifications).values(
      students.map((student) => ({
        id: nanoid(),
        userId: student.id,
        title,
        message,
        type,
      }))
    );

    res.status(201).json({ message: `Announcement sent to ${students.length} students` });
  } catch (error) {
    console.error("Send announcement error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// --- Docent Rooster opgehaald via de centrale schedule tabel ---

router.get("/schedule", checkTeacherRole, async (req: any, res) => {
  try {
    const teacherId = req.currentUser.id;

    const teacherSchedule = await db
      .select()
      .from(schedule)
      .where(eq(schedule.teacherId, teacherId));

    res.json(teacherSchedule);
  } catch (error) {
    console.error("Get teacher schedule error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/teacher/subjects -> Geeft de vakken van de ingelogde docent terug
router.get("/subjects", checkTeacherRole, async (req: any, res) => {
  try {
    const teacherId = req.currentUser.id;

    // Haal de docent op uit de database
    const teacherData = await db.select().from(user).where(eq(user.id, teacherId));
    
    if (teacherData.length === 0) {
      return res.status(404).json({ error: "Docent niet gevonden." });
    }

    // Stel dat de docent een veld 'subjects' heeft (bijv. ["Natuurkunde", "Wiskunde"])
    // Als dit veld niet bestaat, kun je hier een fallback array gebruiken of uit een relatietabel halen.
    const subjects = teacherData[0].subjects ?? ["Natuurkunde"]; // Fallback voorbeeld

    res.json({ subjects });
  } catch (error) {
    console.error("Get teacher subjects error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/programs", checkTeacherRole, async (req: any, res) => {
  try {
    const teacherId = req.currentUser.id;
    const programs = await db
      .select()
      .from(teacherPrograms)
      .where(eq(teacherPrograms.teacherId, teacherId))
      .orderBy(desc(teacherPrograms.createdAt));

    res.json(programs);
  } catch (error) {
    console.error("Get teacher programs error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/teacher/programs -> Voegt een nieuw item toe aan het vakprogramma
router.post("/programs", checkTeacherRole, async (req: any, res) => {
  try {
    const teacherId = req.currentUser.id;
    const { subject, period, chapter, lesson, topics } = req.body;

    if (!subject || !period || !chapter || !lesson) {
      return res.status(400).json({ error: "Vak, periode, hoofdstuk en les zijn verplicht." });
    }

    const newProgram = await db
      .insert(teacherPrograms)
      .values({
        id: nanoid(),
        teacherId,
        subject,
        period,
        chapter,
        lesson,
        topics: topics || null,
      })
      .returning();

    res.status(201).json(newProgram[0]);
  } catch (error) {
    console.error("Create teacher program error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/teacher/grades -> Cijfers-trend van de docent, gegroepeerd per maand
router.get("/grades", checkTeacherRole, async (req: any, res) => {
  try {
    const teacherId = req.currentUser.id;
    const studentFilter = req.query.student as string | undefined;

    const conditions = [eq(grades.teacherId, teacherId)];
    if (studentFilter) {
      conditions.push(eq(grades.studentId, studentFilter));
    }

    const teacherGrades = await db
      .select()
      .from(grades)
      .where(and(...conditions));

    const byMonth = new Map<string, number[]>();

    for (const grade of teacherGrades) {
      const date = new Date(grade.gradedAt);
      const monthKey = date.toLocaleDateString("nl-NL", { month: "short", year: "numeric" });
      if (!byMonth.has(monthKey)) byMonth.set(monthKey, []);
      byMonth.get(monthKey)!.push(grade.score);
    }

    const trend = Array.from(byMonth.entries())
      .map(([period, scores]) => ({
        period,
        value: Number((scores.reduce((sum, s) => sum + s, 0) / scores.length).toFixed(1)),
      }))
      .sort((a, b) => (a.period > b.period ? 1 : -1));

    res.json(trend);
  } catch (error) {
    console.error("Get teacher grades error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/teacher/grades-page -> Haalt cijfers op gesorteerd op klas/student
router.get("/grades-page", checkTeacherRole, async (req: any, res) => {
  try {
    const teacherId = req.currentUser.id;
    const allGrades = await db
      .select()
      .from(grades)
      .where(eq(grades.teacherId, teacherId))
      .orderBy(desc(grades.gradedAt));

    res.json(allGrades);
  } catch (error) {
    console.error("Get teacher grades-page error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/teacher/grades -> Cijfer toevoegen (met assessmentName)
router.post("/grades", checkTeacherRole, async (req: any, res) => {
  try {
    const teacherId = req.currentUser.id;
    const { studentId, subject, score, assessmentName } = req.body;

    if (!studentId || !subject || score === undefined || !assessmentName) {
      return res.status(400).json({ error: "Alle velden zijn verplicht." });
    }

    const newGrade = await db
      .insert(grades)
      .values({
        id: nanoid(),
        studentId,
        teacherId,
        subject,
        score: Number(score),
        assessmentName,
        gradedAt: new Date(),
      })
      .returning();

    res.status(201).json(newGrade[0]);
  } catch (error) {
    console.error("Create grade error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/teacher/grades/:id -> Cijfer verwijderen
router.delete("/grades/:id", checkTeacherRole, async (req: any, res) => {
  try {
    const { id } = req.params;
    await db.delete(grades).where(eq(grades.id, id));
    res.json({ message: "Cijfer succesvol verwijderd." });
  } catch (error) {
    console.error("Delete grade error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/assignments", checkTeacherRole, async (req: any, res) => {
  try {
    const teacherId = req.currentUser.id;
    const { className, title, description, deadline, priority = "MEDIUM" } = req.body;

    if (!className || !title) {
      return res.status(400).json({ error: "className and title are required" });
    }

    const students = await db.select().from(user).where(eq(user.studentClass, className));

    if (students.length === 0) {
      return res.status(404).json({ error: "No students found in that class" });
    }

    const assignmentGroupId = nanoid();

    await db.insert(tasks).values(
      students.map((student) => ({
        id: nanoid(),
        userId: student.id,
        title,
        description: description ?? null,
        deadline: deadline ? new Date(deadline) : null,
        priority,
        status: "ONGOING" as const,
        assignedByTeacherId: teacherId,
        assignmentGroupId,
        assignedClassName: className,
      }))
    );

    res.status(201).json({ assignmentGroupId, studentsAssigned: students.length });
  } catch (error) {
    console.error("Create assignment error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/tasks", checkTeacherRole, async (req: any, res) => {
  try {
    const teacherId = req.currentUser.id;
    const classFilter = req.query.className as string | undefined;

    const conditions = [eq(tasks.assignedByTeacherId, teacherId)];
    if (classFilter && classFilter !== "ALL") {
      conditions.push(eq(tasks.assignedClassName, classFilter));
    }

    const assignedTasks = await db
      .select()
      .from(tasks)
      .where(and(...conditions))
      .orderBy(desc(tasks.createdAt));

    const groups = new Map<string, typeof assignedTasks>();
    for (const task of assignedTasks) {
      const key = task.assignmentGroupId ?? task.id;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(task);
    }

    const result = Array.from(groups.entries()).map(([groupId, rows]) => {
      const first = rows[0];
      return {
        id: groupId,
        title: first.title,
        className: first.assignedClassName,
        deadline: first.deadline,
        totalCount: rows.length,
        submittedCount: rows.filter((r) => r.status === "COMPLETED").length,
      };
    });

    res.json(result);
  } catch (error) {
    console.error("Get teacher assignments error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;