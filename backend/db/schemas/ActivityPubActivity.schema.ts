import { SupportedActivityType } from '@/modules/crossroads/activitypub/activity';
import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const activityPubActivityType = pgEnum(
  'activityPubActivityType',
  Object.values(SupportedActivityType) as [string, ...Array<string>],
);

export const activityPubActivity = pgTable('activityPubActivity', {
  id: text('id').primaryKey(),
  /**
   * Internal id of the activity. If the activity was created by this server,
   * this is how it can be found.
   * It will be the same as the last part of the id of the AP activity.
   */
  internalId: uuid('internalId').unique(),

  receivedOn: timestamp('receivedOn').notNull(),
  type: activityPubActivityType('type')
    .$type<SupportedActivityType>()
    .notNull(),
  actor: text('actor').notNull(),
  object: text('object').notNull(),
  /**
   * The target of the activity.
   * E.g. on unfollow, this is the user being unfollowed.
   * The "object" is the original follow activity in that case.
   */
  target: text('target'),
});

export type ActivityPubActivity = typeof activityPubActivity.$inferSelect;
export type NewActivityPubActivity = typeof activityPubActivity.$inferInsert;
