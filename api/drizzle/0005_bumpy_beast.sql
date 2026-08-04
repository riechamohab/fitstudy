CREATE TABLE "schedule" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"role" text DEFAULT 'student' NOT NULL,
	"day" text NOT NULL,
	"date" date,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"location" text,
	"subject" text NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "schedule" ADD CONSTRAINT "schedule_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;