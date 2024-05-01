DO $$ BEGIN
 CREATE TYPE "activityPubActivityQueueType" AS ENUM('Incoming', 'Outgoing');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "activityPubActivityQueue" (
	"id" text PRIMARY KEY NOT NULL,
	"type" "activityPubActivityQueueType" NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activityPubActivity" DROP COLUMN IF EXISTS "handled";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "activityPubActivityQueue" ADD CONSTRAINT "activityPubActivityQueue_id_activityPubActivity_id_fk" FOREIGN KEY ("id") REFERENCES "activityPubActivity"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
