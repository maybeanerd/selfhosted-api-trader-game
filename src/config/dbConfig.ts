const dbUsername = process.env.DATABASE_USER;
const dbPassword = process.env.DATABASE_PASSWORD;

if (!dbUsername || !dbPassword) {
  throw new Error('Missing database credentials from environment variables.');
}

export const dbConfig = {
  userName: dbUsername,
  password: dbPassword,
};
