CREATE TYPE "public"."role" AS ENUM('teacher', 'student', 'admin');--> statement-breakpoint
CREATE TABLE "class_schedule" (
	"id" text PRIMARY KEY NOT NULL,
	"teacher_id" text NOT NULL,
	"class_name" text NOT NULL,
	"subject" text NOT NULL,
	"room" text,
	"day_of_week" integer NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" text PRIMARY KEY NOT NULL,
	"creator_id" text NOT NULL,
	"scope" text NOT NULL,
	"class_name" text,
	"title" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "focus_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"task_id" text NOT NULL,
	"duration_minutes" integer DEFAULT 25 NOT NULL,
	"break_type" text,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grades" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"teacher_id" text NOT NULL,
	"subject" text NOT NULL,
	"score" integer NOT NULL,
	"graded_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_progress" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"lesson_id" text NOT NULL,
	"status" text DEFAULT 'NOT_STARTED' NOT NULL,
	"progress_percent" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" text PRIMARY KEY NOT NULL,
	"course_id" text NOT NULL,
	"title" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_checklist_items" (
	"id" text PRIMARY KEY NOT NULL,
	"task_id" text NOT NULL,
	"title" text NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "status" SET DEFAULT 'ONGOING';--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" "role" DEFAULT 'student' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "student_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "teacher_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "school" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "study" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "phone_number" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "class" text;--> statement-breakpoint
ALTER TABLE "class_schedule" ADD CONSTRAINT "class_schedule_teacher_id_user_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_creator_id_user_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "focus_sessions" ADD CONSTRAINT "focus_sessions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "focus_sessions" ADD CONSTRAINT "focus_sessions_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grades" ADD CONSTRAINT "grades_student_id_user_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grades" ADD CONSTRAINT "grades_teacher_id_user_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_student_id_user_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_checklist_items" ADD CONSTRAINT "task_checklist_items_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "lesson_progress_student_lesson_idx" ON "lesson_progress" USING btree ("student_id","lesson_id");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_student_id_unique" UNIQUE("student_id");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_teacher_id_unique" UNIQUE("teacher_id");