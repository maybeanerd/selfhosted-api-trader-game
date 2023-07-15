import { ClientSession, Connection } from 'mongoose';

export async function transaction<T>(
  connection: Connection,
  cb: (session: ClientSession) => Promise<T>,
  passedSession?: ClientSession,
): Promise<T> {
  // We want to be able to chain transaction using functions within eachother,
  // so when there is already a session passed we assume it's using a transaction and just continue with it.
  if (passedSession) {
    return cb(passedSession);
  }

  const session = await connection.startSession();

  let result: T;
  await session.withTransaction(async (s) => {
    result = await cb(s);
  });

  await session.endSession();

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return result!;
}
