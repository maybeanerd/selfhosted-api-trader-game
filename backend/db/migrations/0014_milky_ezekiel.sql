ALTER TABLE "storedTreaty" RENAME COLUMN "instanceBaseUrl" TO "activityPubActorId";--> statement-breakpoint
ALTER TABLE "storedTreaty" DROP CONSTRAINT "storedTreaty_instanceBaseUrl_unique";--> statement-breakpoint
ALTER TABLE "storedTreaty" ADD CONSTRAINT "storedTreaty_activityPubActorId_unique" UNIQUE("activityPubActorId");