import { type NodePgQueryResultHKT, drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import * as schema from 'db/schema';
import type { PgTransaction } from 'drizzle-orm/pg-core';
import type { ExtractTablesWithRelations } from 'drizzle-orm';
import * as drizzleConfig from 'drizzle.config';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

const client = new Client(drizzleConfig.default.dbCredentials);

async function runMigrations() {
  const dbClient = new Client(drizzleConfig.default.dbCredentials);

  const db = drizzle(dbClient);
  await dbClient.connect();
  await migrate(db, { migrationsFolder: './db/migrations' });
  await dbClient.end();
}

export async function initializeDb() {
  await runMigrations();

  await client.connect();
}

export const drizz = drizzle(client, { schema });

/* eslint-disable @typescript-eslint/indent */
export type DbTransaction = PgTransaction<
  NodePgQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;
