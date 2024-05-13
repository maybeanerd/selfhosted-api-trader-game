import { Occupation } from '@/modules/resource/types';
import { pgEnum, pgTable, uuid } from 'drizzle-orm/pg-core';

export const occupationType = pgEnum(
  'occupationType',
  Object.values(Occupation) as [string, ...Array<string>],
);

export const user = pgTable('user', {
  id: uuid('id').defaultRandom().primaryKey(),
  currentOccupation: occupationType('currentOccupation')
    .notNull()
    .default(Occupation.MINER),
});

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
