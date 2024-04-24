import { SupportedActivityType } from '@/modules/crossroads/activitypub/activity';
import { activityPubObject } from 'db/schemas/ActivityPubObject.schema';
import { pgEnum, pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core';

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
  object: text('object')
    .notNull()
    .references(() => activityPubObject.id),
  /**
   * If the activity has been handled by the server.
   * By default everything is unhandled and workers need to pick it up first.
   */
  handled: boolean('handled').default(false),
});

export type ActivityPubActivity = typeof activityPubActivity.$inferSelect;
export type NewActivityPubActivity = typeof activityPubActivity.$inferInsert;
