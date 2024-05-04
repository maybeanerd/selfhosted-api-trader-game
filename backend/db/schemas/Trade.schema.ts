import { ResourceType } from '@/modules/resource/types';
import { pgTable, uuid, jsonb, text } from 'drizzle-orm/pg-core';

type ResourceWithAmount = {
  amount: number;
  type: ResourceType;
};

type ResourcesWithAmount = Array<ResourceWithAmount>;

export const trade = pgTable('trade', {
  id: uuid('id').defaultRandom().primaryKey(),
  /**
   * The activitypub actor id of the creator of this trade.
   * Not used for anything right now, maybe later for filtering, statistics, or visualization.
   */
  creatorId: text('creatorId').notNull(),
  offeredResources: jsonb('offeredResources')
    .$type<ResourcesWithAmount>()
    .notNull(),
  requestedResources: jsonb('requestedResources')
    .$type<ResourcesWithAmount>()
    .notNull(),
  /**
   * The activity pub note that relates to this trade.
   *
   * Either it was created by this server or it was received from another instance.
   */
  activityPubNoteId: text('activityPubNoteId').unique().notNull(),
});

export type Trade = typeof trade.$inferSelect;
export type NewTrade = typeof trade.$inferInsert;
