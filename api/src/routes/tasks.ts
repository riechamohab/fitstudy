import { Router } from "express";
import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db } from "../db/index.js";
import { notifications, progress, tasks, taskChecklistItems, TASK_STATUSES } from "../db/schema.js";
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
      status: "ONGOING" as const,
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

    if (status !== undefined && !TASK_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `Status must be one of: ${TASK_STATUSES.join(", ")}`,
      });
    }

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

// --- Task checklist items ---

router.get("/:taskId/checklist", async (req, res) => {
  try {
    const currentUser = await requireUser(req, res);
    if (!currentUser) return;

    const { taskId } = req.params;

    const taskRows = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, currentUser.id)))
      .limit(1);

    if (!taskRows[0]) {
      return res.status(404).json({ error: "Task not found" });
    }

    const items = await db
      .select()
      .from(taskChecklistItems)
      .where(eq(taskChecklistItems.taskId, taskId))
      .orderBy(taskChecklistItems.order);

    res.json(items);
  } catch (error) {
    console.error("Get checklist error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:taskId/checklist", async (req, res) => {
  try {
    const currentUser = await requireUser(req, res);
    if (!currentUser) return;

    const { taskId } = req.params;
    const { title, order } = req.body;

    if (!title || typeof title !== "string") {
      return res.status(400).json({ error: "Title is required" });
    }

    const taskRows = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, currentUser.id)))
      .limit(1);

    if (!taskRows[0]) {
      return res.status(404).json({ error: "Task not found" });
    }

    const inserted = await db
      .insert(taskChecklistItems)
      .values({
        id: nanoid(),
        taskId,
        title,
        order: Number.isFinite(Number(order)) ? Number(order) : 0,
      })
      .returning();

    res.status(201).json(inserted[0]);
  } catch (error) {
    console.error("Create checklist item error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/checklist/:itemId", async (req, res) => {
  try {
    const currentUser = await requireUser(req, res);
    if (!currentUser) return;

    const { itemId } = req.params;
    const { title, completed, order } = req.body;

    const itemRows = await db
      .select()
      .from(taskChecklistItems)
      .where(eq(taskChecklistItems.id, itemId))
      .limit(1);

    const item = itemRows[0];
    if (!item) {
      return res.status(404).json({ error: "Checklist item not found" });
    }

    const taskRows = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, item.taskId), eq(tasks.userId, currentUser.id)))
      .limit(1);

    if (!taskRows[0]) {
      return res.status(404).json({ error: "Checklist item not found" });
    }

    const updated = await db
      .update(taskChecklistItems)
      .set({
        ...(title !== undefined && { title }),
        ...(completed !== undefined && { completed: Boolean(completed) }),
        ...(order !== undefined && { order: Number(order) }),
        updatedAt: new Date(),
      })
      .where(eq(taskChecklistItems.id, itemId))
      .returning();

    res.json(updated[0]);
  } catch (error) {
    console.error("Update checklist item error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/checklist/:itemId", async (req, res) => {
  try {
    const currentUser = await requireUser(req, res);
    if (!currentUser) return;

    const { itemId } = req.params;

    const itemRows = await db
      .select()
      .from(taskChecklistItems)
      .where(eq(taskChecklistItems.id, itemId))
      .limit(1);

    const item = itemRows[0];
    if (!item) {
      return res.status(404).json({ error: "Checklist item not found" });
    }

    const taskRows = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, item.taskId), eq(tasks.userId, currentUser.id)))
      .limit(1);

    if (!taskRows[0]) {
      return res.status(404).json({ error: "Checklist item not found" });
    }

    await db.delete(taskChecklistItems).where(eq(taskChecklistItems.id, itemId));

    res.json({ message: "Checklist item deleted" });
  } catch (error) {
    console.error("Delete checklist item error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;