import { boolean, integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { user } from "./auth-schema.js";

export const TASK_STATUSES = [
  "ONGOING",
  "COMPLETED",
  "CANCELED",
  "INCOMPLETE",
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const tasks = pgTable("tasks", {
  id: text("id").primaryKey(),

  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  courseId: text("course_id").references(() => courses.id, { onDelete: "set null" }),

  title: text("title").notNull(),
  description: text("description"),
  deadline: timestamp("deadline"),

  status: text("status").notNull().default("ONGOING"),
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
  sleepHours: integer("sleep_hours"),
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

export const classSchedule = pgTable("class_schedule", {
  id: text("id").primaryKey(),

  teacherId: text("teacher_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  className: text("class_name").notNull(),
  subject: text("subject").notNull(),
  room: text("room"),

  dayOfWeek: integer("day_of_week").notNull(), // 0 = Sunday ... 6 = Saturday
  startTime: text("start_time").notNull(), // "09:00"
  endTime: text("end_time").notNull(), // "10:00"

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const COURSE_SCOPES = ["class", "personal"] as const;
export type CourseScope = (typeof COURSE_SCOPES)[number];

export const courses = pgTable("courses", {
  id: text("id").primaryKey(),

  creatorId: text("creator_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  scope: text("scope").notNull(), 
  className: text("class_name"), 

  title: text("title").notNull(),
  description: text("description"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const chapters = pgTable("chapters", {
  id: text("id").primaryKey(),

  courseId: text("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),

  title: text("title").notNull(),
  order: integer("order").notNull().default(0),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const lessons = pgTable("lessons", {
  id: text("id").primaryKey(),

  courseId: text("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),

  chapterId: text("chapter_id").references(() => chapters.id, { onDelete: "cascade" }),

  title: text("title").notNull(),
  order: integer("order").notNull().default(0),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const lessonItems = pgTable("lesson_items", {
  id: text("id").primaryKey(),

  lessonId: text("lesson_id")
    .notNull()
    .references(() => lessons.id, { onDelete: "cascade" }),

  title: text("title").notNull(),
  order: integer("order").notNull().default(0),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const lessonItemProgress = pgTable(
  "lesson_item_progress",
  {
    id: text("id").primaryKey(),

    studentId: text("student_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    itemId: text("item_id")
      .notNull()
      .references(() => lessonItems.id, { onDelete: "cascade" }),

    completed: boolean("completed").notNull().default(false),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("lesson_item_progress_student_item_idx").on(
      table.studentId,
      table.itemId
    ),
  ]
);

export const LESSON_STATUSES = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"] as const;
export type LessonStatus = (typeof LESSON_STATUSES)[number];

export const lessonProgress = pgTable(
  "lesson_progress",
  {
    id: text("id").primaryKey(),

    studentId: text("student_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    lessonId: text("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),

    status: text("status").notNull().default("NOT_STARTED"),
    progressPercent: integer("progress_percent").notNull().default(0),

    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("lesson_progress_student_lesson_idx").on(
      table.studentId,
      table.lessonId
    ),
  ]
);

export const taskChecklistItems = pgTable("task_checklist_items", {
  id: text("id").primaryKey(),

  taskId: text("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),

  title: text("title").notNull(),
  completed: boolean("completed").notNull().default(false),
  order: integer("order").notNull().default(0),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const BREAK_TYPES = ["SHORT", "LONG"] as const;
export type BreakType = (typeof BREAK_TYPES)[number];

export const focusSessions = pgTable("focus_sessions", {
  id: text("id").primaryKey(),

  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  taskId: text("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),

  durationMinutes: integer("duration_minutes").notNull().default(25),
  breakType: text("break_type"), 

  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const grades = pgTable("grades", {
  id: text("id").primaryKey(),

  studentId: text("student_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  teacherId: text("teacher_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  subject: text("subject").notNull(),
  score: integer("score").notNull(), 

  gradedAt: timestamp("graded_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const teacherNotes = pgTable("teacher_notes", {
  id: text("id").primaryKey(),

  studentId: text("student_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  teacherId: text("teacher_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  message: text("message").notNull(),
  read: boolean("read").notNull().default(false),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});