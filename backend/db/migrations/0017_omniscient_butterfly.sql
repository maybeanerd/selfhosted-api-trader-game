DROP TABLE "storedEvent";--> statement-breakpoint
DROP TABLE "storedTreaty";--> statement-breakpoint
ALTER TABLE "trade" RENAME COLUMN "remoteInstanceId" TO "activityPubNoteId";--> statement-breakpoint
ALTER TABLE "trade" ALTER COLUMN "creatorId" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "trade" ALTER COLUMN "activityPubNoteId" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "trade" ALTER COLUMN "activityPubNoteId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "activityPubActor" ADD COLUMN "isFollowingThisServer" boolean NOT NULL;--> statement-breakpoint
ALTER TABLE "trade" ADD CONSTRAINT "trade_activityPubNoteId_unique" UNIQUE("activityPubNoteId");