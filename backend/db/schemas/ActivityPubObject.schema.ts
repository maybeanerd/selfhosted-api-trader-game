import { SupportedObjectType } from '@/modules/crossroads/activitypub/object/';
import type { ResourceType } from '@/modules/resource/types';
import {
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const activityPubObjectType = pgEnum(
  'activityPubObjectType',
  Object.values(SupportedObjectType) as [string, ...Array<string>],
);

export type GameContent = {
  requestedResources: Array<{ type: ResourceType; amount: number }>;
  offeredResources: Array<{ type: ResourceType; amount: number }>;
};

export const activityPubObject = pgTable('activityPubObject', {
  id: text('id').primaryKey(),
  /**
   * Internal id of the object. If the object was created by this server,
   * this is how it can be found.
   * It will be the same as the last part of the id of the AP object.
   */
  internalId: uuid('internalId').unique(),

  type: activityPubObjectType('type').$type<SupportedObjectType>().notNull(),
  published: timestamp('published').notNull(),
  attributedTo: text('attributedTo').notNull(),
  content: text('content').notNull(),
  gameContent: jsonb('gameContent').$type<GameContent>().notNull(),
  inReplyTo: text('inReplyTo'),
  to: text('to').notNull(),
});

export type ActivityPubObject = typeof activityPubObject.$inferSelect;
export type NewActivityPubObject = typeof activityPubObject.$inferInsert;
