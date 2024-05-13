DO $$ BEGIN
 CREATE TYPE "public"."occupationType" AS ENUM('miner', 'logger', 'hunter');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TYPE "resourceType" ADD VALUE 'leather';--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "currentOccupation" "occupationType" DEFAULT 'miner' NOT NULL;