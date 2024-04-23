const dbHost = process.env.DATABASE_HOST ?? 'localhost:5432';

if (!process.env.DATABASE_HOST) {
  console.warn(
    'Missing database config from environment variables. Falling back to default values.',
  );
}

export const dbConfig = {
  host: dbHost,
};
