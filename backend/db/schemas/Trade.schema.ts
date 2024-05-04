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
   * The id of the user who created the trade. Only needed for internal users,
   * as the acceptance of the trade is done via the activity pub note.
   */
  creatorId: uuid('creatorId'),
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
