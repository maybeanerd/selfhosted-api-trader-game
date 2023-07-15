const dbHost = process.env.DATABASE_HOST;

if (!dbHost) {
  throw new Error('Missing database config from environment variables.');
}

export const dbConfig = {
  host: dbHost,
};
