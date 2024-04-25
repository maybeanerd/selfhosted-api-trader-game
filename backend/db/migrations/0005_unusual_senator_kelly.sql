DO $$ BEGIN
 CREATE TYPE "activityPubActorType" AS ENUM('Person', 'Application');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "activityPubActor" (
	"id" text PRIMARY KEY NOT NULL,
	"type" "activityPubActorType" NOT NULL,
	"preferredUsername" text NOT NULL,
	"inbox" text NOT NULL,
	"outbox" text NOT NULL,
	"publicKeyId" text NOT NULL,
	"publicKeyPem" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activityPubActivity" DROP CONSTRAINT "activityPubActivity_object_activityPubObject_id_fk";
--> statement-breakpoint
ALTER TABLE "activityPubObject" ALTER COLUMN "to" DROP DEFAULT;