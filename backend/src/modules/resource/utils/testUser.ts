import { drizz } from 'db';
import { user } from 'db/schema';

export async function getUserId() {
  const foundUser = await drizz.query.user.findFirst();
  if (foundUser) {
    return foundUser.id;
  }
  const insertedUsers = await drizz.insert(user).values({}).returning();
  const userId = insertedUsers.at(0)?.id;
  if (!userId) {
    throw new Error('Failed to insert user');
  }
  return userId;
}
