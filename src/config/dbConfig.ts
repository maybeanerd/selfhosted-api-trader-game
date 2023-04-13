const dbUsername = process.env.DATABASE_USER;
const dbPassword = process.env.DATABASE_PASSWORD;
const dbHost = process.env.DATABASE_HOST;

if (!dbUsername || !dbPassword || !dbHost) {
  throw new Error('Missing database credentials from environment variables.');
}

export const dbConfig = {
  userName: dbUsername,
  password: dbPassword,
  host: dbHost,
};
