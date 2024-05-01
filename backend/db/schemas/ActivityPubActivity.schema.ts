import { SupportedActivityType } from '@/modules/crossroads/activitypub/activity';
import { pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const activityPubActivityType = pgEnum(
  'activityPubActivityType',
  Object.values(SupportedActivityType) as [string, ...Array<string>],
);

export const activityPubActivity = pgTable('activityPubActivity', {
  id: text('id').primaryKey(),
  receivedOn: timestamp('receivedOn').notNull(),
  type: activityPubActivityType('type')
    .$type<SupportedActivityType>()
    .notNull(),
  actor: text('actor').notNull(),
  object: text('object').notNull(),
});

export type ActivityPubActivity = typeof activityPubActivity.$inferSelect;
export type NewActivityPubActivity = typeof activityPubActivity.$inferInsert;
