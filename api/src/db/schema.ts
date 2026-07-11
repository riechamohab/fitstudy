import { boolean, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth-schema.js";

export const tasks = pgTable("tasks", {
  id: text("id").primaryKey(),

  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  title: text("title").notNull(),
  description: text("description"),
  deadline: timestamp("deadline"),

  status: text("status").notNull().default("PENDING"),
  priority: text("priority").notNull().default("MEDIUM"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const exercises = pgTable("exercises", {
  id: text("id").primaryKey(),

  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  type: text("type").notNull(),
  duration: integer("duration").notNull(),
  completed: boolean("completed").notNull().default(false),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const stressLevels = pgTable("stress_levels", {
  id: text("id").primaryKey(),

  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  level: integer("level").notNull(),
  focus: integer("focus").notNull(),
  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const progress = pgTable("progress", {
  id: text("id").primaryKey(),

  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  taskId: text("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),

  completed: boolean("completed").notNull().default(false),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),

  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(),
  read: boolean("read").notNull().default(false),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const motivationMessages = pgTable("motivation_messages", {
  id: text("id").primaryKey(),
  message: text("message").notNull(),
  active: boolean("active").notNull().default(true),
});