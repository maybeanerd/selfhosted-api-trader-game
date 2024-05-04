DO $$ BEGIN
 CREATE TYPE "treatyStatus" AS ENUM('requested', 'denied', 'signed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "storedTreaty" (
	"activityPubActorId" text PRIMARY KEY NOT NULL,
	"status" "treatyStatus" NOT NULL,
	"createdOn" timestamp DEFAULT now() NOT NULL
);
