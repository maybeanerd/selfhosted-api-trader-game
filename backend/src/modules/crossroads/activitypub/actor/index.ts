import {
  getActorPublicKeyUrl,
  getActorUrl,
  getInboxUrl,
  getOutboxUrl,
} from '@/modules/crossroads/activitypub/utils/apUrl';
import { generateKeys } from '@/modules/crossroads/activitypub/utils/signing';
import type { APActor, APRoot } from 'activitypub-types';

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

async function getActorFromId(
  id: string,
  username?: string,
): Promise<ActivityPubActor> {
  // TODO store and get from and to DB
  const { publicKey } = await generateKeys();

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
