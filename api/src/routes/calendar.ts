import { Router } from "express";
import { desc, eq } from "drizzle-orm";

import { db } from "../db/index.js";
import { tasks, classSchedule } from "../db/schema.js";
import { requireUser } from "../lib/auth-session.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
      const currentUser = await requireUser(req, res);
  
    if (!currentUser) {
    return;
    }
  
      const userId = currentUser.id;

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
      const currentUser = await requireUser(req, res);
  
    if (!currentUser) {
    return;
    }
  
      const userId = currentUser.id;

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
      const currentUser = await requireUser(req, res);
  
    if (!currentUser) {
    return;
    }
  
      const userId = currentUser.id;

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
      const currentUser = await requireUser(req, res);
  
    if (!currentUser) {
    return;
    }
  
      const userId = currentUser.id;

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

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

router.get("/planner", async (req, res) => {
  try {
    const currentUser = await requireUser(req, res);

    if (!currentUser) {
      return;
    }

    const view = (req.query.view as string) || "week";
    const dateParam = req.query.date as string | undefined;
    const referenceDate = dateParam
      ? new Date(`${dateParam}T00:00:00`)
      : new Date();

    if (Number.isNaN(referenceDate.getTime())) {
      return res.status(400).json({ error: "Invalid date" });
    }

    let rangeStart: Date;
    let rangeEnd: Date;

    if (view === "day") {
      rangeStart = new Date(referenceDate);
      rangeStart.setHours(0, 0, 0, 0);
      rangeEnd = new Date(rangeStart);
      rangeEnd.setHours(23, 59, 59, 999);
    } else if (view === "month") {
      const firstOfMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
      const lastOfMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0);

      rangeStart = new Date(firstOfMonth);
      rangeStart.setDate(firstOfMonth.getDate() - firstOfMonth.getDay());
      rangeStart.setHours(0, 0, 0, 0);

      rangeEnd = new Date(lastOfMonth);
      rangeEnd.setDate(lastOfMonth.getDate() + (6 - lastOfMonth.getDay()));
      rangeEnd.setHours(23, 59, 59, 999);
    } else {
      // week
      const dayOfWeek = referenceDate.getDay();
      rangeStart = new Date(referenceDate);
      rangeStart.setDate(referenceDate.getDate() - dayOfWeek);
      rangeStart.setHours(0, 0, 0, 0);
      rangeEnd = new Date(rangeStart);
      rangeEnd.setDate(rangeStart.getDate() + 6);
      rangeEnd.setHours(23, 59, 59, 999);
    }

    const userTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, currentUser.id));

    const studentClass = (currentUser as { studentClass?: string | null }).studentClass;

    const classEntries = studentClass
      ? await db
          .select()
          .from(classSchedule)
          .where(eq(classSchedule.className, studentClass))
      : [];

    const days = [];
    const cursor = new Date(rangeStart);

    while (cursor <= rangeEnd) {
      const dayDate = new Date(cursor);
      const dayOfWeek = dayDate.getDay();
      const dateKey = toDateKey(dayDate);

      const dayTasks = userTasks.filter((task) => {
        if (!task.deadline) return false;
        return toDateKey(new Date(task.deadline)) === dateKey;
      });

      const dayClasses = classEntries
        .filter((entry) => entry.dayOfWeek === dayOfWeek)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

      days.push({
        date: dateKey,
        dayName: dayDate.toLocaleDateString("en-US", { weekday: "long" }),
        isCurrentMonth:
          view !== "month" || dayDate.getMonth() === referenceDate.getMonth(),
        classSchedule: dayClasses,
        tasks: dayTasks,
      });

      cursor.setDate(cursor.getDate() + 1);
    }

    res.json({
      view,
      rangeStart: toDateKey(rangeStart),
      rangeEnd: toDateKey(rangeEnd),
      days,
    });
  } catch (error) {
    console.error("Get planner error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/schedule", async (req, res) => {
  try {
    const currentUser = await requireUser(req, res);
    if (!currentUser) return;

    const studentClass = (currentUser as { studentClass?: string | null }).studentClass;

    if (!studentClass) {
      return res.json({ className: null, entries: [] });
    }

    const entries = await db
      .select()
      .from(classSchedule)
      .where(eq(classSchedule.className, studentClass))
      .orderBy(classSchedule.dayOfWeek, classSchedule.startTime);

    res.json({ className: studentClass, entries });
  } catch (error) {
    console.error("Get class schedule error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;