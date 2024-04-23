import { pgTable, uuid } from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
  id: uuid('id').defaultRandom().primaryKey(),
});

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
