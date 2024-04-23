DO $$ BEGIN
 CREATE TYPE "activityPubActivityType" AS ENUM('Create', 'Update', 'Delete', 'Follow', 'Like');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "activityPubObjectType" AS ENUM('Note');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "activityPubActivity" (
	"id" text PRIMARY KEY NOT NULL,
	"receivedOn" timestamp NOT NULL,
	"type" "activityPubActivityType" NOT NULL,
	"actor" text NOT NULL,
	"object" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "activityPubObject" (
	"id" text PRIMARY KEY NOT NULL,
	"receivedOn" timestamp NOT NULL,
	"type" "activityPubObjectType" NOT NULL,
	"published" timestamp NOT NULL,
	"attributedTo" text NOT NULL,
	"content" text NOT NULL,
	"inReplyTo" text,
	"to" text DEFAULT 'https://www.w3.org/ns/activitystreams#Public' NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "activityPubActivity" ADD CONSTRAINT "activityPubActivity_object_activityPubObject_id_fk" FOREIGN KEY ("object") REFERENCES "activityPubObject"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
