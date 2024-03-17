import 'dotenv/config';
import { dbConfig } from '@/config/dbConfig';
import type { Config } from 'drizzle-kit';

export default {
  schema: './db/schema.ts',
  out: './db/migrations',
  driver: 'pg', 
  dbCredentials: {
    host: dbConfig.host,
    port: 5432,
    user: 'root',
    password: 'root',
    database: 'nest',
  },
} satisfies Config;