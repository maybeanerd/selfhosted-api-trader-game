import { SupportedObjectType } from '@/modules/crossroads/activitypub/object/note';
import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const activityPubObjectType = pgEnum(
  'activityPubObjectType',
  Object.values(SupportedObjectType) as [string, ...Array<string>],
);

export const activityPubObject = pgTable('activityPubObject', {
  id: text('id').primaryKey(),
  receivedOn: timestamp('receivedOn').notNull(),
  type: activityPubObjectType('type').$type<SupportedObjectType>().notNull(),
  published: timestamp('published').notNull(),
  attributedTo: text('attributedTo').notNull(),
  content: text('content').notNull(),
  inReplyTo: text('inReplyTo'),
  to: text('to')
    .notNull()
    .default('https://www.w3.org/ns/activitystreams#Public'),
  /**
   * If the object comes from this server it will have an internalId
   * which will be mapped to the id in the corresponding table (e.g. the trade)
   * By convention it should be the same as the uuid used as part of the id of the AP object
   */
  internalId: uuid('internalId').unique(),
});

export type ActivityPubObject = typeof activityPubObject.$inferSelect;
export type NewActivityPubObject = typeof activityPubObject.$inferInsert;
