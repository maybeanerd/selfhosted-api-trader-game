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

export const instanceActor: APActor = {
  type: 'Person',
  id: getActorUrl('instanceActor').toString(),
  summary: 'instanceActor',
  inbox: 'https://actor2.example.org/inbox',
  outbox: 'https://actor2.example.org/outbox',
};

export async function getActorFromId(
  id: string,
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
    type: 'Person',
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
export const actors: Array<APActor> = [instanceActor];

const realInstanceActor = getActorFromId('realInstanceActor');

realInstanceActor.then((actor) => {
  actors.push(actor);
});
