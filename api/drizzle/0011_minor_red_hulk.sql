ALTER TABLE "user" ADD COLUMN "school_year" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "study_history" text;--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "banned";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "ban_reason";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "ban_expires";--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_student_id_unique" UNIQUE("student_id");