import {
  getActorUrl,
  getInboxUrl,
  getOutboxUrl,
} from '@/modules/crossroads/activitypub/utils/apUrl';
import type { APActor, APRoot } from 'activitypub-types';

export const instanceActor: APActor = {
  type: 'Person',
  id: getActorUrl('instanceActor').toString(),
  summary: 'instanceActor',
  inbox: 'https://actor2.example.org/inbox',
  outbox: 'https://actor2.example.org/outbox',
};

export const realInstanceActor: APRoot<APActor> = {
  '@context': [
    'https://www.w3.org/ns/activitystreams',
    'https://w3id.org/security/v1',
  ],

  id: getActorUrl('realInstanceActor').toString(),
  type: 'Person',
  preferredUsername: 'realInstanceActor',
  inbox: getInboxUrl().toString(),
  outbox: getOutboxUrl().toString(),

  // TODO figure out why this is in the example in https://blog.joinmastodon.org/2018/06/how-to-implement-a-basic-activitypub-server/, but not supported by this type
  /*   publicKey: {
    id: 'https://my-example.com/actor#main-key',
    owner: 'https://my-example.com/actor',
    publicKeyPem: '-----BEGIN PUBLIC KEY-----...-----END PUBLIC KEY-----',
  }, */
};

export const actors: Array<APActor> = [instanceActor, realInstanceActor];
