import { Router } from "express";
import { desc, eq } from "drizzle-orm";

import { db } from "../db/index.js";
import { tasks } from "../db/schema.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];

    if (!userId || typeof userId !== "string") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const startDate = req.query.start
      ? new Date(req.query.start as string)
      : new Date();

    const endDate = req.query.end
      ? new Date(req.query.end as string)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const userTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, userId));

    const calendarTasks = userTasks
      .filter((task) => {
        if (!task.deadline) return false;

        const deadline = new Date(task.deadline);

        return deadline >= startDate && deadline <= endDate;
      })
      .sort((a, b) => {
        if (!a.deadline || !b.deadline) return 0;

        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      });

    const calendarEvents = calendarTasks.map((task) => ({
      id: task.id,
      title: task.title,
      date: task.deadline,
      type: "task",
      priority: task.priority,
      status: task.status,
      description: task.description,
    }));

    res.json(calendarEvents);
  } catch (error) {
    console.error("Get calendar error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/week", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];

    if (!userId || typeof userId !== "string") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const weekOffset = Number(req.query.weekOffset ?? 0);

    const today = new Date();
    const currentDay = today.getDay();

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - currentDay + weekOffset * 7);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const userTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, userId));

    const weekTasks = userTasks.filter((task) => {
      if (!task.deadline) return false;

      const deadline = new Date(task.deadline);

      return deadline >= weekStart && deadline <= weekEnd;
    });

    const weekDays = [];

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + i);

      const dayTasks = weekTasks.filter((task) => {
        if (!task.deadline) return false;

        const taskDate = new Date(task.deadline);

        return taskDate.toDateString() === dayDate.toDateString();
      });

      weekDays.push({
        date: dayDate,
        dayName: dayDate.toLocaleDateString("en-US", {
          weekday: "long",
        }),
        tasks: dayTasks,
        taskCount: dayTasks.length,
        completedCount: dayTasks.filter(
          (task) => task.status === "COMPLETED"
        ).length,
      });
    }

    res.json(weekDays);
  } catch (error) {
    console.error("Get week view error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/overview", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];

    if (!userId || typeof userId !== "string") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const weekFromNow = new Date(today);
    weekFromNow.setDate(today.getDate() + 7);

    const userTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, userId))
      .orderBy(desc(tasks.createdAt));

    const todayTasks = userTasks.filter((task) => {
      if (!task.deadline) return false;

      const deadline = new Date(task.deadline);

      return (
        deadline >= today &&
        deadline < tomorrow &&
        task.status !== "COMPLETED"
      );
    }).length;

    const upcomingTasks = userTasks.filter((task) => {
      if (!task.deadline) return false;

      const deadline = new Date(task.deadline);

      return (
        deadline >= tomorrow &&
        deadline <= weekFromNow &&
        task.status !== "COMPLETED"
      );
    }).length;

    const overdueTasks = userTasks.filter((task) => {
      if (!task.deadline) return false;

      const deadline = new Date(task.deadline);

      return deadline < today && task.status !== "COMPLETED";
    }).length;

    const completedTasks = userTasks.filter(
      (task) => task.status === "COMPLETED"
    ).length;

    const recentTasks = userTasks.slice(0, 5);

    res.json({
      overview: {
        today: todayTasks,
        thisWeek: upcomingTasks,
        overdue: overdueTasks,
        completed: completedTasks,
      },
      recentTasks,
    });
  } catch (error) {
    console.error("Get overview error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/deadlines", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];

    if (!userId || typeof userId !== "string") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const days = Number(req.query.days ?? 30);

    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + days);

    const userTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, userId));

    const deadlineTasks = userTasks
      .filter((task) => {
        if (!task.deadline) return false;

        const deadline = new Date(task.deadline);

        return deadline <= deadlineDate && task.status !== "COMPLETED";
      })
      .sort((a, b) => {
        if (!a.deadline || !b.deadline) return 0;

        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      })
      .slice(0, 20);

    const tasksWithDaysUntil = deadlineTasks.map((task) => {
      const deadline = new Date(task.deadline as Date);

      const daysUntil = Math.ceil(
        (deadline.getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      );

      return {
        ...task,
        daysUntil,
        urgency:
          daysUntil <= 3 ? "high" : daysUntil <= 7 ? "medium" : "low",
      };
    });

    res.json(tasksWithDaysUntil);
  } catch (error) {
    console.error("Get deadlines error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;