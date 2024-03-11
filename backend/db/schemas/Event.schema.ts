import { EventPayload, EventType } from '@/modules/crossroads/event/types';
import { pgEnum, pgTable, uuid, jsonb, timestamp } from 'drizzle-orm/pg-core';

const storedEventType = pgEnum(
  'storedEventType',
  Object.values(EventType) as [string, ...Array<string>],
);

export const storedEvent = pgTable('storedEvent', {
  id: uuid('id').defaultRandom().primaryKey(),
  /**
   * The date this event was created on.
   */
  createdOn: timestamp('createdOn').notNull(),
  /**
   * The date this instance first received this event.
   *
   * Maybe in the future this can be used to determine lag between instances or similar things.
   */
  receivedOn: timestamp('receivedOn').notNull(),
  /**
   * The Id of a connected remote instance if the trade comes from a remote one.
   */
  remoteInstanceId: uuid('remoteInstanceId'),
  type: storedEventType('type').$type<EventType>().notNull(),
  payload: jsonb('payload').$type<EventPayload>().notNull(),
});

export type StoredEvent = typeof storedEvent.$inferSelect;
export type NewStoredEvent = typeof storedEvent.$inferInsert;
