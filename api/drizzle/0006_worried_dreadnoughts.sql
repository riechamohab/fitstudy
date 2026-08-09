CREATE TABLE "teacher_programs" (
	"id" text PRIMARY KEY NOT NULL,
	"teacher_id" text NOT NULL,
	"subject" text NOT NULL,
	"period" text NOT NULL,
	"chapter" text NOT NULL,
	"lesson" text NOT NULL,
	"topics" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "schedule" ADD COLUMN "class_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "schedule" ADD COLUMN "teacher_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "subjects" text[];--> statement-breakpoint
ALTER TABLE "schedule" ADD CONSTRAINT "schedule_teacher_id_user_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;