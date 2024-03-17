import { ResourceType } from '@/modules/resource/types';
import { pgTable, uuid, jsonb } from 'drizzle-orm/pg-core';

type ResourceWithAmount = {
  amount: number;
  type: ResourceType;
};

type ResourcesWithAmount = Array<ResourceWithAmount>;

export const trade = pgTable('trade', {
  id: uuid('id').defaultRandom().primaryKey(),
  creatorId: uuid('creatorId').notNull(),
  offeredResources: jsonb('offeredResources')
    .$type<ResourcesWithAmount>()
    .notNull(),
  requestedResources: jsonb('requestedResources')
    .$type<ResourcesWithAmount>()
    .notNull(),
  /**
   * The Id of a connected remote instance if the trade comes from a remote one.
   */
  remoteInstanceId: uuid('remoteInstanceId'),
});

export type Trade = typeof trade.$inferSelect;
export type NewTrade = typeof trade.$inferInsert;
