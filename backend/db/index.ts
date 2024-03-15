import { dbConfig } from '@/config/dbConfig';
import { type NodePgQueryResultHKT, drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import * as schema from 'db/schema';
import type { PgTransaction } from 'drizzle-orm/pg-core';
import type { ExtractTablesWithRelations } from 'drizzle-orm';

const client = new Client({
  host: dbConfig.host,
  port: 5432,
  user: 'root',
  password: 'root',
  database: 'nest',
});

export async function initializeDb() {
  await client.connect();
}
export const drizz = drizzle(client, { schema });

/* eslint-disable @typescript-eslint/indent */
export type DbTransaction = PgTransaction<
  NodePgQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;
