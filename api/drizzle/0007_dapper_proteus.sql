ALTER TABLE "tasks" ADD COLUMN "assigned_by_teacher_id" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "assigned_class_name" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "assignment_group_id" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_by_teacher_id_user_id_fk" FOREIGN KEY ("assigned_by_teacher_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;