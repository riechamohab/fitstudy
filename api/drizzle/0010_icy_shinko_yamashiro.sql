CREATE TABLE "wellbeing_quiz_responses" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"answers" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "water_logs" ADD COLUMN "amount_ml" integer DEFAULT 250 NOT NULL;--> statement-breakpoint
ALTER TABLE "wellbeing_quiz_responses" ADD CONSTRAINT "wellbeing_quiz_responses_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;