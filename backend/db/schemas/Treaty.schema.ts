import { pgTable, uuid, pgEnum, text, timestamp } from 'drizzle-orm/pg-core';

// TODO declare this somewhere else
export enum TreatyStatus {
  Requested = 'requested',
  Denied = 'denied',
  Signed = 'signed',
}
const treatyStatus = pgEnum(
  'treatyStatus',
  Object.values(TreatyStatus) as [string, ...Array<string>],
);

export const storedTreaty = pgTable('storedTreaty', {
  /**
   * The Id of the instance this treaty was made with.
   */
  id: uuid('id').defaultRandom().primaryKey(),
  /**
   * The URL this instance can be reached at.
   * */
  instanceBaseUrl: text('instanceBaseUrl').unique().notNull(),
  /**
   * The state of the treaty. A treaty is a request at first, and then either gets accepted or denied by the other instance.
   */
  status: treatyStatus('status').$type<TreatyStatus>().notNull(),
  /**
   * The date this treaty was created on.
   */
  createdOn: timestamp('createdOn').notNull(),
});

export type StoredTreaty = typeof storedTreaty.$inferSelect;
export type NewStoredTreaty = typeof storedTreaty.$inferInsert;
