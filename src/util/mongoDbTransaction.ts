import { ClientSession, Connection } from 'mongoose';

export async function transaction<T>(connection: Connection, cb: (session: ClientSession) => Promise<T>): Promise<T> {
  const session = await connection.startSession();

  let result: T;
  await session.withTransaction(async (s) => {
    result = await cb(s);
  });

  await session.endSession();
  
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return result!;
}