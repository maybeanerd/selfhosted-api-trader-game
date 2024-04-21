import {
  getActorPublicKeyUrl,
  getActorUrl,
  getInboxUrl,
  getOutboxUrl,
} from '@/modules/crossroads/activitypub/utils/apUrl';
import type { APActor, APRoot } from 'activitypub-types';
import { drizz } from 'db';

export type ActivityPubActor = APRoot<APActor> & {
  publicKey: {
    id: string;
    owner: string;
    publicKeyPem: string;
  };
};

async function getActorFromId(
  id: string,
  type: 'Application' | 'Person' = 'Person',
  username?: string,
): Promise<ActivityPubActor> {
  const serverState = await drizz.query.serverState.findFirst();
  if (serverState === undefined) {
    throw new Error('Server state not found.');
  }

  const { publicKey } = serverState;

  const actorId = getActorUrl(id).toString();

  return {
    '@context': [
      'https://www.w3.org/ns/activitystreams',
      'https://w3id.org/security/v1',
    ],

    id: actorId,
    type,
    preferredUsername: username ?? id,
    inbox: getInboxUrl().toString(),
    outbox: getOutboxUrl().toString(),

    publicKey: {
      id: getActorPublicKeyUrl(id).toString(),
      owner: actorId,
      publicKeyPem: publicKey,
    },
  };
}
async function getInstanceActorId(): Promise<string> {
  const serverState = await drizz.query.serverState.findFirst();
  if (serverState === undefined) {
    throw new Error('Server state not found.');
  }
  const { instanceId } = serverState;
  return instanceId;
}

const instanceActorUsername = 'merchant';

export async function getInstanceActor() {
  const instanceId = await getInstanceActorId();
  const actor = await getActorFromId(
    instanceId,
    'Application',
    instanceActorUsername,
  );
  return actor;
}
