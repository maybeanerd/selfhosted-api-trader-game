import { pgTable, uuid } from 'drizzle-orm/pg-core';

export const serverState = pgTable('serverState', {
  /**
   * The Id we created for this instance.
   */
  instanceId: uuid('instanceId').defaultRandom().primaryKey(),
});

export type ServerState = typeof serverState.$inferSelect;
export type NewServerState = typeof serverState.$inferInsert;
