import {
  getActorPublicKeyUrl,
  getActorUrl,
  getInboxUrl,
  getOutboxUrl,
} from '@/modules/crossroads/activitypub/utils/apUrl';
import type { APActor, APRoot } from 'activitypub-types';
import { drizz } from 'db';

export type PublicKeyObject = {
  id: string;
  owner: string;
  publicKeyPem: string;
};

export type ActivityPubActor = APRoot<APActor> & {
  publicKey: PublicKeyObject;
};

export async function getActorFromId(
  { id, publicKey }: { id: string; publicKey: string },
  type: 'Application' | 'Person' = 'Person',
  username?: string,
): Promise<ActivityPubActor> {
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

export async function getPublicKeyOfActor(
  id: string,
): Promise<PublicKeyObject> {
  const serverState = await drizz.query.serverState.findFirst();
  if (serverState === undefined) {
    throw new Error('Server state not found.');
  }

  const { publicKey } = serverState;

  return {
    id: getActorPublicKeyUrl(id).toString(),
    owner: getActorUrl(id).toString(),
    publicKeyPem: publicKey,
  };
}

export const instanceActorUsername = 'merchant';

export async function getInstanceActor() {
  const serverState = await drizz.query.serverState.findFirst();
  if (serverState === undefined) {
    throw new Error('Server state not found.');
  }

  const { instanceId, publicKey } = serverState;

  const actor = await getActorFromId(
    { id: instanceId, publicKey },
    'Application',
    instanceActorUsername,
  );

  return {
    actor,
    internalId: instanceId,
  };
}
