import { SupportedObjectType } from '@/modules/crossroads/activitypub/object/note';
import { pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

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
});

export type ActivityPubObject = typeof activityPubObject.$inferSelect;
export type NewActivityPubObject = typeof activityPubObject.$inferInsert;
