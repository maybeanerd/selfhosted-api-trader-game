import { TreatyStatus } from '@/modules/treaty/types/treatyStatus';
import { pgTable, pgEnum, text, timestamp } from 'drizzle-orm/pg-core';

export const treatyStatus = pgEnum(
  'treatyStatus',
  Object.values(TreatyStatus) as [string, ...Array<string>],
);

export const storedTreaty = pgTable('storedTreaty', {
  /**
   * The AP Actor this treaty was made with.
   * */
  activityPubActorId: text('activityPubActorId').primaryKey(),
  /**
   * The state of the treaty. A treaty is a request at first, and then either gets accepted or denied by the other instance.
   */
  status: treatyStatus('status').$type<TreatyStatus>().notNull(),
  /**
   * The date this treaty was created on.
   */
  createdOn: timestamp('createdOn').defaultNow().notNull(),
});

export type StoredTreaty = typeof storedTreaty.$inferSelect;
export type NewStoredTreaty = typeof storedTreaty.$inferInsert;
