import { pgTable, uuid, text } from 'drizzle-orm/pg-core';

export const serverState = pgTable('serverState', {
  /**
   * The Id we created for this instance.
   */
  instanceId: uuid('instanceId').defaultRandom().primaryKey(),

  // TODO prob pass in env or something
  privateKey: text('privateKey').notNull(),
  publicKey: text('publicKey').notNull(),
});

export type ServerState = typeof serverState.$inferSelect;
export type NewServerState = typeof serverState.$inferInsert;
