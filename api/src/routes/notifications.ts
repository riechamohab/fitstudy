import { Router } from "express";
import { and, desc, eq } from "drizzle-orm";

import { db } from "../db/index.js";
import { notifications } from "../db/schema.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];

    if (!userId || typeof userId !== "string") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const unread = req.query.unread as string | undefined;
    const type = req.query.type as string | undefined;

    const conditions = [eq(notifications.userId, userId)];

    if (unread === "true") {
      conditions.push(eq(notifications.read, false));
    }

    if (type) {
      conditions.push(eq(notifications.type, type));
    }

    const result = await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(50);

    res.json(result);
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/count", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];

    if (!userId || typeof userId !== "string") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const allNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId));

    const unreadNotifications = allNotifications.filter(
      (notification) => notification.read === false
    );

    res.json({
      total: allNotifications.length,
      unread: unreadNotifications.length,
    });
  } catch (error) {
    console.error("Get notification count error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/read-all", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];

    if (!userId || typeof userId !== "string") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await db
      .update(notifications)
      .set({
        read: true,
      })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.read, false)
        )
      );

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Mark all notifications read error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id/read", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];

    if (!userId || typeof userId !== "string") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;

    const updatedNotifications = await db
      .update(notifications)
      .set({
        read: true,
      })
      .where(
        and(
          eq(notifications.id, id),
          eq(notifications.userId, userId)
        )
      )
      .returning();

    const notification = updatedNotifications[0];

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json(notification);
  } catch (error) {
    console.error("Mark notification read error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];

    if (!userId || typeof userId !== "string") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;

    const deletedNotifications = await db
      .delete(notifications)
      .where(
        and(
          eq(notifications.id, id),
          eq(notifications.userId, userId)
        )
      )
      .returning();

    const notification = deletedNotifications[0];

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;