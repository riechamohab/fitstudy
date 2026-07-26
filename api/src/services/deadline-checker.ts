import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db } from "../db/index.js";
import { notifications, tasks } from "../db/schema.js";

async function checkDeadlines() {
  try {
    console.log("Checking task deadlines...");

    const now = new Date();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(23, 59, 59, 999);

    const allTasks = await db.select().from(tasks);

    const upcomingTasks = allTasks.filter((task) => {
      if (!task.deadline) return false;

      const deadline = new Date(task.deadline);

      return (
        deadline >= tomorrow &&
        deadline <= nextWeek &&
        task.status === "ONGOING"
      );
    });

    for (const task of upcomingTasks) {
      const message = `Task "${task.title}" is due on ${new Date(
        task.deadline as Date
      ).toLocaleDateString()}`;

      const existingNotifications = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, task.userId),
            eq(notifications.title, "Upcoming Deadline"),
            eq(notifications.type, "DEADLINE")
          )
        );

      const alreadyExists = existingNotifications.some((notification) =>
        notification.message.includes(task.title)
      );

      if (!alreadyExists) {
        await db.insert(notifications).values({
          id: nanoid(),
          userId: task.userId,
          title: "Upcoming Deadline",
          message,
          type: "DEADLINE",
        });

        console.log(`Upcoming deadline notification created for: ${task.title}`);
      }
    }

    // Only tasks still ONGOING past their deadline become INCOMPLETE.
    // Tasks the student already completed or canceled are left alone.
    const overdueTasks = allTasks.filter((task) => {
      if (!task.deadline) return false;

      const deadline = new Date(task.deadline);

      return deadline < now && task.status === "ONGOING";
    });

    for (const task of overdueTasks) {
      await db
        .update(tasks)
        .set({ status: "INCOMPLETE", updatedAt: new Date() })
        .where(eq(tasks.id, task.id));

      const message = `Task "${task.title}" was due on ${new Date(
        task.deadline as Date
      ).toLocaleDateString()} and is now marked incomplete.`;

      const existingNotifications = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, task.userId),
            eq(notifications.title, "Task Overdue"),
            eq(notifications.type, "DEADLINE")
          )
        );

      const alreadyExists = existingNotifications.some((notification) =>
        notification.message.includes(task.title)
      );

      if (!alreadyExists) {
        await db.insert(notifications).values({
          id: nanoid(),
          userId: task.userId,
          title: "Task Overdue",
          message,
          type: "DEADLINE",
        });

        console.log(`Task marked incomplete and notified: ${task.title}`);
      }
    }

    console.log("Deadline check completed.");
  } catch (error) {
    console.error("Deadline check error:", error);
  }
}

export function startDeadlineChecker() {
  checkDeadlines();

  setInterval(() => {
    checkDeadlines();
  }, 60 * 60 * 1000);
}