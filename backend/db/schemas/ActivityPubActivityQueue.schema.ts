import { activityPubActivity } from 'db/schema';
import { pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export enum ActivityPubActivityQueueType {
  'Incoming' = 'Incoming',
  'Outgoing' = 'Outgoing',
}

export const activityPubActivityQueueType = pgEnum(
  'activityPubActivityQueueType',
  Object.values(ActivityPubActivityQueueType) as [string, ...Array<string>],
);

export const activityPubActivityQueue = pgTable('activityPubActivityQueue', {
  id: text('id')
    .primaryKey()
    .references(() => activityPubActivity.id),
  type: activityPubActivityQueueType('type')
    .$type<ActivityPubActivityQueueType>()
    .notNull(),
  createdOn: timestamp('createdOn').notNull().defaultNow(),
});

export type ActivityPubActivityQueue =
  typeof activityPubActivityQueue.$inferSelect;
export type NewActivityPubActivityQueue =
  typeof activityPubActivityQueue.$inferInsert;
