import { dbConfig } from '@/config/dbConfig';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import * as schema from 'db/schema';

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
