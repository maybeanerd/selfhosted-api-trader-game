import type { APActor, APRoot } from 'activitypub-types';

export type PublicKeyObject = {
  id: string;
  owner: string;
  publicKeyPem: string;
};

export type ActivityPubActorObject = APRoot<APActor> & {
  publicKey: PublicKeyObject;
  id: string;
};

export enum SupportedActorType {
  'Person' = 'Person',
  'Application' = 'Application',
}
