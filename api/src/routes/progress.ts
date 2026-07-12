import { Router } from "express";
import { and, desc, eq, gte, lt } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db } from "../db/index.js";
import {
  exercises,
  motivationMessages,
  notifications,
  progress,
  stressLevels,
  tasks,
} from "../db/schema.js";
import { requireUser } from "../lib/auth-session.js";

const router = Router();

const defaultMotivationMessages = [
  "You're doing great! Every step forward is progress.",
  "Believe in yourself! You're capable of amazing things.",
  "Small progress is still progress. Keep going!",
  "Your hard work will pay off. Stay focused!",
  "Take it one task at a time. You've got this!",
  "Success is the sum of small efforts repeated daily.",
  "You're stronger than you think. Keep pushing forward!",
  "Every expert was once a beginner. Keep learning!",
  "Your future self will thank you for the work you're doing today.",
  "Progress, not perfection. You're on the right track!",
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
      (task) => task.status === "IN_PROGRESS"
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