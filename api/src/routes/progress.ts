import { Router } from "express";
import { and, desc, eq, gte, lt } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db } from "../db/index.js";
import {
  exercises,
  focusSessions,
  grades,
  motivationMessages,
  notifications,
  progress,
  stressLevels,
  tasks,
} from "../db/schema.js";
import { requireUser } from "../lib/auth-session.js";

const router = Router();

const defaultMotivationMessages = [
  "Je doet het geweldig! Elke stap vooruit is vooruitgang.",
  "Geloof in jezelf! Je bent tot geweldige dingen in staat.",
  "Kleine vooruitgang is nog steeds vooruitgang. Ga zo door!",
  "Je harde werk gaat lonen. Blijf gefocust!",
  "Neem het één taak tegelijk. Je kan dit!",
  "Succes is de optelsom van kleine inspanningen, dag na dag.",
  "Je bent sterker dan je denkt. Blijf doorzetten!",
  "Elke expert was ooit een beginner. Blijf leren!",
  "Je toekomstige zelf zal je dankbaar zijn voor het werk dat je vandaag doet.",
  "Vooruitgang, geen perfectie. Je zit op de goede weg!",
];

router.get("/", async (req, res) => {
  try {
      const currentUser = await requireUser(req, res);
  
    if (!currentUser) {
    return;
    }
  
      const userId = currentUser.id;

    const userTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, userId));

    const userProgress = await db
      .select()
      .from(progress)
      .where(eq(progress.userId, userId))
      .orderBy(desc(progress.createdAt))
      .limit(10);

    const now = new Date();

    const totalTasks = userTasks.length;
    const completedTasks = userTasks.filter(
      (task) => task.status === "COMPLETED"
    ).length;
    const inProgressTasks = userTasks.filter(
      (task) => task.status === "ONGOING"
    ).length;
    const overdueTasks = userTasks.filter(
      (task) =>
        task.deadline !== null &&
        task.deadline < now &&
        task.status !== "COMPLETED"
    ).length;

    const completionRate =
      totalTasks > 0 ? Number(((completedTasks / totalTasks) * 100).toFixed(1)) : 0;

    res.json({
      stats: {
        total: totalTasks,
        completed: completedTasks,
        inProgress: inProgressTasks,
        overdue: overdueTasks,
        completionRate,
      },
      recentProgress: userProgress,
    });
  } catch (error) {
    console.error("Get progress error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/motivation", async (req, res) => {
  try {
      const currentUser = await requireUser(req, res);
  
    if (!currentUser) {
    return;
    }
  
      const userId = currentUser.id;

    let messages = await db
      .select()
      .from(motivationMessages)
      .where(eq(motivationMessages.active, true));

    if (messages.length === 0) {
      await db.insert(motivationMessages).values(
        defaultMotivationMessages.map((message) => ({
          id: nanoid(),
          message,
          active: true,
        }))
      );

      messages = await db
        .select()
        .from(motivationMessages)
        .where(eq(motivationMessages.active, true));
    }

    const randomIndex = Math.floor(Math.random() * messages.length);
    const selectedMessage = messages[randomIndex];

    await db.insert(notifications).values({
      id: nanoid(),
      userId,
      title: "Daily Motivation",
      message: selectedMessage.message,
      type: "MOTIVATION",
    });

    res.json(selectedMessage);
  } catch (error) {
    console.error("Get motivation error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/achievements", async (req, res) => {
  try {
      const currentUser = await requireUser(req, res);
  
    if (!currentUser) {
    return;
    }
  
      const userId = currentUser.id;

    const userTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, userId));

    const userExercises = await db
      .select()
      .from(exercises)
      .where(eq(exercises.userId, userId));

    const userStressLevels = await db
      .select()
      .from(stressLevels)
      .where(eq(stressLevels.userId, userId));

    const userProgress = await db
      .select()
      .from(progress)
      .where(eq(progress.userId, userId))
      .orderBy(desc(progress.createdAt))
      .limit(30);

    const completedTasks = userTasks.filter(
      (task) => task.status === "COMPLETED"
    ).length;

    const completedExercises = userExercises.filter(
      (exercise) => exercise.completed === true
    ).length;

    const stressEntries = userStressLevels.length;
    const currentStreak = calculateStreak(userProgress);

    const achievements = [];

    achievements.push({
      name: "First Task Complete",
      description: "Completed your first task!",
      earned: completedTasks >= 1,
    });

    achievements.push({
      name: "Task Master",
      description: "Completed 5 tasks",
      earned: completedTasks >= 5,
    });

    achievements.push({
      name: "Productivity Pro",
      description: "Completed 10 tasks",
      earned: completedTasks >= 10,
    });

    achievements.push({
      name: "Wellness Beginner",
      description: "Completed your first exercise",
      earned: completedExercises >= 1,
    });

    achievements.push({
      name: "Wellness Warrior",
      description: "Completed 5 exercises",
      earned: completedExercises >= 5,
    });

    achievements.push({
      name: "Self-Aware",
      description: "Started tracking your wellness",
      earned: stressEntries >= 1,
    });

    achievements.push({
      name: "Consistent Tracker",
      description: "7 days of wellness tracking",
      earned: stressEntries >= 7,
    });

    achievements.push({
      name: "On a Roll",
      description: "3 day streak!",
      earned: currentStreak >= 3,
    });

    achievements.push({
      name: "Week Warrior",
      description: "7 day streak!",
      earned: currentStreak >= 7,
    });

    res.json({ achievements, currentStreak });
  } catch (error) {
    console.error("Get achievements error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/stats", async (req, res) => {
  try {
      const currentUser = await requireUser(req, res);
  
    if (!currentUser) {
    return;
    }
  
      const userId = currentUser.id;

    const days = Number(req.query.days ?? 30);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const userProgress = await db
      .select()
      .from(progress)
      .where(
        and(
          eq(progress.userId, userId),
          gte(progress.createdAt, startDate),
          eq(progress.completed, true)
        )
      );

    const userExercises = await db
      .select()
      .from(exercises)
      .where(
        and(
          eq(exercises.userId, userId),
          gte(exercises.createdAt, startDate),
          eq(exercises.completed, true)
        )
      );

    const userStressLevels = await db
      .select()
      .from(stressLevels)
      .where(
        and(
          eq(stressLevels.userId, userId),
          gte(stressLevels.createdAt, startDate)
        )
      );

    const avgStressLevel =
      userStressLevels.length > 0
        ? Number(
            (
              userStressLevels.reduce((sum, entry) => sum + entry.level, 0) /
              userStressLevels.length
            ).toFixed(1)
          )
        : 0;

    const weeklyStats = getWeeklyStats(userProgress, userExercises, days);

    res.json({
      period: `Last ${days} days`,
      tasksCompleted: userProgress.length,
      exercisesCompleted: userExercises.length,
      stressEntries: userStressLevels.length,
      avgStressLevel,
      weeklyStats,
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

function monthRange(monthsAgo: number) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const end = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 1);
  return { start, end };
}

async function buildMonthlyOverview(userId: string) {
  const { start: thisMonthStart, end: thisMonthEnd } = monthRange(0);
  const { start: lastMonthStart, end: lastMonthEnd } = monthRange(1);

  const thisMonthSessions = await db
    .select()
    .from(focusSessions)
    .where(
      and(
        eq(focusSessions.userId, userId),
        gte(focusSessions.startedAt, thisMonthStart),
        lt(focusSessions.startedAt, thisMonthEnd)
      )
    );

  const shortBreaks = thisMonthSessions.filter((s) => s.breakType === "SHORT").length;
  const longBreaks = thisMonthSessions.filter((s) => s.breakType === "LONG").length;

  const thisMonthTasks = await db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        gte(tasks.createdAt, thisMonthStart),
        lt(tasks.createdAt, thisMonthEnd)
      )
    );

  const completedThisMonth = thisMonthTasks.filter((t) => t.status === "COMPLETED").length;
  const taskCompletionRate =
    thisMonthTasks.length > 0
      ? Number(((completedThisMonth / thisMonthTasks.length) * 100).toFixed(1))
      : 0;

  const thisMonthGrades = await db
    .select()
    .from(grades)
    .where(
      and(
        eq(grades.studentId, userId),
        gte(grades.gradedAt, thisMonthStart),
        lt(grades.gradedAt, thisMonthEnd)
      )
    );

  const lastMonthGrades = await db
    .select()
    .from(grades)
    .where(
      and(
        eq(grades.studentId, userId),
        gte(grades.gradedAt, lastMonthStart),
        lt(grades.gradedAt, lastMonthEnd)
      )
    );

  const allGrades = await db
    .select()
    .from(grades)
    .where(eq(grades.studentId, userId));

  const avg = (rows: { score: number }[]) =>
    rows.length > 0
      ? Number((rows.reduce((sum, r) => sum + r.score, 0) / rows.length).toFixed(1))
      : null;

  const thisMonthAvg = avg(thisMonthGrades);
  const lastMonthAvg = avg(lastMonthGrades);
  const overallAvg = avg(allGrades);

  let gradeChangePercent: number | null = null;
  if (thisMonthAvg !== null && lastMonthAvg !== null && lastMonthAvg !== 0) {
    gradeChangePercent = Number(
      (((thisMonthAvg - lastMonthAvg) / lastMonthAvg) * 100).toFixed(1)
    );
  }

  return {
    month: thisMonthStart.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    focusSessions: {
      total: thisMonthSessions.length,
      shortBreaks,
      longBreaks,
    },
    tasks: {
      completed: completedThisMonth,
      total: thisMonthTasks.length,
      completionRate: taskCompletionRate,
    },
    grades: {
      thisMonthAvg,
      lastMonthAvg,
      overallAvg,
      changePercent: gradeChangePercent,
    },
  };
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(key: string) {
  return new Date(`${key}T00:00:00`);
}

function diffInDays(a: Date, b: Date) {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.round((a.getTime() - b.getTime()) / MS_PER_DAY);
}

function weekRange(weeksAgo: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayOfWeek = today.getDay();

  const start = new Date(today);
  start.setDate(today.getDate() - dayOfWeek - weeksAgo * 7);

  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  return { start, end };
}

function computeStreak(activeDateKeysDesc: string[]) {
  if (activeDateKeysDesc.length === 0) {
    return { count: 0, status: "none" as const, daysSinceLastActive: null };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const mostRecent = parseDateKey(activeDateKeysDesc[0]);
  const daysSinceLastActive = diffInDays(today, mostRecent);

  if (daysSinceLastActive > 2) {
    return { count: 0, status: "broken" as const, daysSinceLastActive };
  }

  let count = 1;
  for (let i = 1; i < activeDateKeysDesc.length; i++) {
    const gap = diffInDays(
      parseDateKey(activeDateKeysDesc[i - 1]),
      parseDateKey(activeDateKeysDesc[i])
    );
    if (gap <= 3) {
      count++;
    } else {
      break;
    }
  }

  const status = daysSinceLastActive === 0 ? ("active" as const) : ("frozen" as const);
  return { count, status, daysSinceLastActive };
}

router.get("/dashboard-week", async (req, res) => {
  try {
    const currentUser = await requireUser(req, res);
    if (!currentUser) return;

    const userId = currentUser.id;

    const { start: thisWeekStart, end: thisWeekEnd } = weekRange(0);
    const { start: lastWeekStart, end: lastWeekEnd } = weekRange(1);

    const thisWeekSessions = await db
      .select()
      .from(focusSessions)
      .where(
        and(
          eq(focusSessions.userId, userId),
          gte(focusSessions.startedAt, thisWeekStart),
          lt(focusSessions.startedAt, thisWeekEnd)
        )
      );

    const thisWeekMinutes = thisWeekSessions.reduce(
      (sum, s) => sum + s.durationMinutes,
      0
    );
    const thisWeekHours = Number((thisWeekMinutes / 60).toFixed(1));
    const percentOfWeek = Number(((thisWeekMinutes / 60 / 84) * 100).toFixed(1));

    const lastWeekSessions = await db
      .select()
      .from(focusSessions)
      .where(
        and(
          eq(focusSessions.userId, userId),
          gte(focusSessions.startedAt, lastWeekStart),
          lt(focusSessions.startedAt, lastWeekEnd)
        )
      );

    const lastWeekMinutes = lastWeekSessions.reduce(
      (sum, s) => sum + s.durationMinutes,
      0
    );

    let weeklyChangePercent: number | null = null;
    if (lastWeekMinutes > 0) {
      weeklyChangePercent = Number(
        (((thisWeekMinutes - lastWeekMinutes) / lastWeekMinutes) * 100).toFixed(1)
      );
    } else if (thisWeekMinutes > 0) {
      weeklyChangePercent = 100;
    }

    const userTasks = await db.select().from(tasks).where(eq(tasks.userId, userId));

    const weekTasks = userTasks.filter((task) => {
      if (!task.deadline) return false;
      const deadline = new Date(task.deadline);
      return deadline >= thisWeekStart && deadline < thisWeekEnd;
    });

    const weekTasksCompleted = weekTasks.filter((t) => t.status === "COMPLETED").length;

    const allSessions = await db
      .select()
      .from(focusSessions)
      .where(eq(focusSessions.userId, userId));

    const activeDateKeys = Array.from(
      new Set(allSessions.map((s) => toDateKey(new Date(s.startedAt))))
    ).sort((a, b) => (a < b ? 1 : -1)); 

    const streak = computeStreak(activeDateKeys);

    res.json({
      studyHours: {
        hours: thisWeekHours,
        minutes: thisWeekMinutes,
        percentOfWeek,
      },
      tasksThisWeek: {
        completed: weekTasksCompleted,
        total: weekTasks.length,
      },
      weeklyComparison: {
        thisWeekMinutes,
        lastWeekMinutes,
        changePercent: weeklyChangePercent,
      },
      streak,
    });
  } catch (error) {
    console.error("Get dashboard week error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/monthly", async (req, res) => {
  try {
    const currentUser = await requireUser(req, res);
    if (!currentUser) return;

    const overview = await buildMonthlyOverview(currentUser.id);
    res.json(overview);
  } catch (error) {
    console.error("Get monthly progress error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/grades", async (req, res) => {
  try {
    const currentUser = await requireUser(req, res);
    if (!currentUser) return;

    const studentGrades = await db
      .select()
      .from(grades)
      .where(eq(grades.studentId, currentUser.id))
      .orderBy(desc(grades.gradedAt));

    res.json(studentGrades);
  } catch (error) {
    console.error("Get grades error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/export", async (req, res) => {
  try {
    const currentUser = await requireUser(req, res);
    if (!currentUser) return;

    const userId = currentUser.id;

    const overview = await buildMonthlyOverview(userId);

    const userTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, userId))
      .orderBy(desc(tasks.createdAt));

    const userGrades = await db
      .select()
      .from(grades)
      .where(eq(grades.studentId, userId))
      .orderBy(desc(grades.gradedAt));

    const lines: string[] = [];

    lines.push("FitStudy Progress Report");
    lines.push(`Month,${overview.month}`);
    lines.push("");
    lines.push("Summary");
    lines.push("Metric,Value");
    lines.push(`Focus sessions this month,${overview.focusSessions.total}`);
    lines.push(`Short breaks,${overview.focusSessions.shortBreaks}`);
    lines.push(`Long breaks,${overview.focusSessions.longBreaks}`);
    lines.push(`Tasks completed this month,${overview.tasks.completed}/${overview.tasks.total}`);
    lines.push(`Task completion rate,${overview.tasks.completionRate}%`);
    lines.push(`Grade average this month,${overview.grades.thisMonthAvg ?? "N/A"}`);
    lines.push(`Grade average last month,${overview.grades.lastMonthAvg ?? "N/A"}`);
    lines.push(`Overall grade average,${overview.grades.overallAvg ?? "N/A"}`);
    lines.push(`Grade change,${overview.grades.changePercent ?? "N/A"}%`);
    lines.push("");

    lines.push("Tasks");
    lines.push("Title,Status,Priority,Deadline");
    for (const task of userTasks) {
      const safeTitle = task.title.replace(/"/g, '""');
      lines.push(
        `"${safeTitle}",${task.status},${task.priority},${task.deadline ? new Date(task.deadline).toLocaleDateString() : ""}`
      );
    }
    lines.push("");

    lines.push("Grades");
    lines.push("Subject,Score,Date");
    for (const grade of userGrades) {
      const safeSubject = grade.subject.replace(/"/g, '""');
      lines.push(`"${safeSubject}",${grade.score},${new Date(grade.gradedAt).toLocaleDateString()}`);
    }

    const csv = lines.join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="fitstudy-progress-${new Date().toISOString().split("T")[0]}.csv"`
    );
    res.send(csv);
  } catch (error) {
    console.error("Export progress error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

function calculateStreak(userProgress: { createdAt: Date }[]) {
  if (userProgress.length === 0) {
    return 0;
  }

  const uniqueDays = new Set(
    userProgress.map((entry) => entry.createdAt.toDateString())
  );

  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 30; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);

    if (uniqueDays.has(checkDate.toDateString())) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  return streak;
}

function getWeeklyStats(
  userProgress: { createdAt: Date }[],
  userExercises: { createdAt: Date }[],
  days: number
) {
  const weeks = Math.ceil(days / 7);
  const weeklyData = [];

  for (let i = 0; i < weeks; i++) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - i * 7 - 6);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const tasksCompleted = userProgress.filter(
      (entry) => entry.createdAt >= weekStart && entry.createdAt <= weekEnd
    ).length;

    const exercisesCompleted = userExercises.filter(
      (entry) => entry.createdAt >= weekStart && entry.createdAt <= weekEnd
    ).length;

    weeklyData.unshift({
      week: `Week ${i + 1}`,
      tasksCompleted,
      exercisesCompleted,
    });
  }

  return weeklyData;
}

export default router;