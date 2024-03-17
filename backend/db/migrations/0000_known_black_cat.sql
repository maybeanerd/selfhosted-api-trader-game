CREATE TABLE IF NOT EXISTS "resource" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ownerId" uuid NOT NULL,
	"amount" integer NOT NULL,
	"upgradeLevel" integer NOT NULL,
	"type" "resourceType" NOT NULL,
	CONSTRAINT "resource_ownerId_type_unique" UNIQUE("ownerId","type")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "serverState" (
	"instanceId" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "storedEvent" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdOn" timestamp NOT NULL,
	"receivedOn" timestamp NOT NULL,
	"remoteInstanceId" uuid,
	"type" "storedEventType" NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "storedTreaty" (
	"instanceId" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"instanceBaseUrl" text NOT NULL,
	"status" "treatyStatus" NOT NULL,
	"createdOn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "storedTreaty_instanceBaseUrl_unique" UNIQUE("instanceBaseUrl")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "trade" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creatorId" uuid NOT NULL,
	"offeredResources" jsonb NOT NULL,
	"requestedResources" jsonb NOT NULL,
	"remoteInstanceId" uuid
);
