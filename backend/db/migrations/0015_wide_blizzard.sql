ALTER TABLE "activityPubObject" ALTER COLUMN "internalId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "activityPubActivity" ADD COLUMN "internalId" uuid;--> statement-breakpoint
ALTER TABLE "activityPubActivity" ADD CONSTRAINT "activityPubActivity_internalId_unique" UNIQUE("internalId");