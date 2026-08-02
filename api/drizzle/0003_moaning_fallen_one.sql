ALTER TABLE "user" DROP CONSTRAINT "user_student_id_unique";--> statement-breakpoint
ALTER TABLE "user" DROP CONSTRAINT "user_teacher_id_unique";--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'student';--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "impersonated_by" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "banned" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "ban_reason" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "ban_expires" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "student_class" text;--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "class";--> statement-breakpoint
DROP TYPE "public"."role";