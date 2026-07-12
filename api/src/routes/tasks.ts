import { Router } from "express";
import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db } from "../db/index.js";
import { notifications, progress, tasks } from "../db/schema.js";
import { requireUser } from "../lib/auth-session.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const currentUser = await requireUser(req, res);

  if (!currentUser) {
  return;
  }

    const userId = currentUser.id;

    const status = req.query.status as string | undefined;
    const priority = req.query.priority as string | undefined;

    const conditions = [eq(tasks.userId, userId)];

    if (status) {
      conditions.push(eq(tasks.status, status));
    }

    if (priority) {
      conditions.push(eq(tasks.priority, priority));
    }

    const result = await db
      .select()
      .from(tasks)
      .where(and(...conditions))
      .orderBy(desc(tasks.createdAt));

    res.json(result);
  } catch (error) {
    console.error("Get tasks error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const currentUser = await requireUser(req, res);

  if (!currentUser) {
  return;
  }

    const userId = currentUser.id;

    const { id } = req.params;

    const result = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .limit(1);

    const task = result[0];

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json(task);
  } catch (error) {
    console.error("Get task error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const currentUser = await requireUser(req, res);

  if (!currentUser) {
  return;
  }

    const userId = currentUser.id;

    const {
      title,
      description,
      deadline,
      priority = "MEDIUM",
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const newTask = {
      id: nanoid(),
      userId,
      title,
      description: description ?? null,
      deadline: deadline ? new Date(deadline) : null,
      priority,
    };

    const insertedTasks = await db.insert(tasks).values(newTask).returning();
    const task = insertedTasks[0];

    if (deadline) {
      await db.insert(notifications).values({
        id: nanoid(),
        userId,
        title: "New Task Deadline",
        message: `Task "${title}" has a deadline on ${new Date(deadline).toLocaleDateString()}`,
        type: "DEADLINE",
      });
    }

    res.status(201).json(task);
  } catch (error) {
    console.error("Create task error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const currentUser = await requireUser(req, res);

  if (!currentUser) {
  return;
  }

    const userId = currentUser.id;

    const { id } = req.params;
    const { title, description, deadline, status, priority } = req.body;

    const existingTasks = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .limit(1);

    const existingTask = existingTasks[0];

    if (!existingTask) {
      return res.status(404).json({ error: "Task not found" });
    }

    const updatedTasks = await db
      .update(tasks)
      .set({
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(deadline !== undefined && {
          deadline: deadline ? new Date(deadline) : null,
        }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        updatedAt: new Date(),
      })
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning();

    const updatedTask = updatedTasks[0];

    if (status === "COMPLETED") {
      await db.insert(progress).values({
        id: nanoid(),
        userId,
        taskId: id,
        completed: true,
      });

      await db.insert(notifications).values({
        id: nanoid(),
        userId,
        title: "Task Completed!",
        message: `Congratulations! You completed "${updatedTask.title}"`,
        type: "PROGRESS_UPDATE",
      });
    }

    res.json(updatedTask);
  } catch (error) {
    console.error("Update task error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const currentUser = await requireUser(req, res);

  if (!currentUser) {
  return;
  }

    const userId = currentUser.id;

    const { id } = req.params;

    const existingTasks = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .limit(1);

    const existingTask = existingTasks[0];

    if (!existingTask) {
      return res.status(404).json({ error: "Task not found" });
    }

    await db
      .delete(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Delete task error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;