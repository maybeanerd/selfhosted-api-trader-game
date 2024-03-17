import { ResourceType } from '@/modules/resource/types';
import { pgTable, uuid, integer, pgEnum, unique } from 'drizzle-orm/pg-core';

export const resourceType = pgEnum(
  'resourceType',
  Object.values(ResourceType) as [string, ...Array<string>],
);

export const resource = pgTable(
  'resource',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ownerId: uuid('ownerId').notNull(),
    amount: integer('amount').notNull(),
    upgradeLevel: integer('upgradeLevel').notNull(),
    type: resourceType('type').$type<ResourceType>().notNull(),
  },
  (r) => ({
    oneTypePerOwner: unique().on(r.ownerId, r.type),
  }),
);

export type Resource = typeof resource.$inferSelect;
export type NewResource = typeof resource.$inferInsert;
