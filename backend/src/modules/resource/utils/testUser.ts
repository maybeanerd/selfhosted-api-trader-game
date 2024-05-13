import { drizz } from 'db';
import { User, user } from 'db/schema';

export async function getUser(): Promise<User> {
  const foundUser = await drizz.query.user.findFirst();
  if (foundUser) {
    return foundUser;
  }
  const insertedUsers = await drizz.insert(user).values({}).returning();
  const insertedUser = insertedUsers.at(0);
  if (!insertedUser) {
    throw new Error('Failed to insert user');
  }

  return insertedUser;
}
