import { boolean, integer, jsonb, pgTable, text, timestamp, uniqueIndex, date, time } from "drizzle-orm/pg-core";
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

  assignedByTeacherId: text("assigned_by_teacher_id").references(() => user.id, {
    onDelete: "set null",
  }),
  assignedClassName: text("assigned_class_name"),
  assignmentGroupId: text("assignment_group_id"),

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
  assessmentName: text("assessment_name"),

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

export const ENROLLMENT_STATUSES = ["CURRENT", "COMPLETED"] as const;
export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];
 
export const enrollmentHistory = pgTable("enrollment_history", {
  id: text("id").primaryKey(),
 
  studentId: text("student_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
 
  schoolYear: text("school_year").notNull(), 
  className: text("class_name").notNull(),
  status: text("status").notNull().default("COMPLETED"), 
 
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const achievementsUnlocked = pgTable(
  "achievements_unlocked",
  {
    id: text("id").primaryKey(),
 
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
 
    achievementKey: text("achievement_key").notNull(),
    unlockedAt: timestamp("unlocked_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("achievements_unlocked_user_key_idx").on(
      table.userId,
      table.achievementKey
    ),
  ]
);
 
export const userAchievements = pgTable(
  "user_achievements",
  {
    id: text("id").primaryKey(),
 
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
 
    achievementKey: text("achievement_key").notNull(),
    unlockedAt: timestamp("unlocked_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("user_achievements_user_key_idx").on(
      table.userId,
      table.achievementKey
    ),
  ]
);

export const waterLogs = pgTable("water_logs", {
  id: text("id").primaryKey(),
 
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  amountMl: integer("amount_ml").notNull().default(250),
 
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const wellbeingQuizResponses = pgTable("wellbeing_quiz_responses", {
  id: text("id").primaryKey(),

  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  answers: jsonb("answers").notNull().$type<{ question: string; answer: string }[]>(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const schedule = pgTable("schedule", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  role: text("role").default("student").notNull(),
  day: text("day").notNull(),
  date: date("date"),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  location: text("location"),
  subject: text("subject").notNull(),
  className: text("class_name").notNull(), // De klas (bijv. "B 4")
  teacherId: text("teacher_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }), // Gekoppeld aan de docent
  createdBy: text("created_by")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }), // De admin die het aanmaakt
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const teacherPrograms = pgTable("teacher_programs", {
  id: text("id").primaryKey(),
  teacherId: text("teacher_id").notNull(),
  subject: text("subject").notNull(),
  className: text("class_name").notNull(),
  period: text("period").notNull(), // Bijv. "Kwartaal 1" of "2026 - Jaar"
  chapter: text("chapter").notNull(), // Bijv. "Hoofdstuk 4"
  lesson: text("lesson").notNull(), // Bijv. "Les 2: Krachten en Beweging"
  topics: text("topics"), // Bijv. "Zwaartekracht, wrijving, formule F=m*a"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});