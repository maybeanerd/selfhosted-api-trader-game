ALTER TABLE "activityPubActivity" ADD COLUMN "handled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "activityPubObject" ADD COLUMN "internalId" uuid;--> statement-breakpoint
ALTER TABLE "activityPubObject" ADD CONSTRAINT "activityPubObject_internalId_unique" UNIQUE("internalId");