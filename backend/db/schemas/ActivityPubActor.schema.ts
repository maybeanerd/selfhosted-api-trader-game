import { SupportedActorType } from '@/modules/crossroads/activitypub/actor/types';
import { pgEnum, pgTable, text } from 'drizzle-orm/pg-core';

export const activityPubActorType = pgEnum(
  'activityPubActorType',
  Object.values(SupportedActorType) as [string, ...Array<string>],
);

export const activityPubActor = pgTable('activityPubActor', {
  id: text('id').primaryKey(),
  type: activityPubActorType('type').$type<SupportedActorType>().notNull(),
  preferredUsername: text('preferredUsername').notNull(),
  inbox: text('inbox').notNull(),
  outbox: text('outbox').notNull(),
  publicKeyId: text('publicKeyId').notNull(),
  publicKeyPem: text('publicKeyPem').notNull(),
});

export type ActivityPubActor = typeof activityPubActor.$inferSelect;
export type NewActivityPubActor = typeof activityPubActor.$inferInsert;
