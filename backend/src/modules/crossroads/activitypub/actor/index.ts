import {
  ActivityPubActorObject,
  SupportedActorType,
} from '@/modules/crossroads/activitypub/actor/types';
import {
  getActorPublicKeyUrl,
  getActorUrl,
  getInboxUrl,
  getOutboxUrl,
} from '@/modules/crossroads/activitypub/utils/apUrl';
import { activityPubIsGameServerExtension } from '@/modules/crossroads/activitypub/utils/gameServerExtension';
import { drizz } from 'db';

async function getActorFromId(
  { id, publicKey }: { id: string; publicKey: string },
  type: SupportedActorType = SupportedActorType.Person,
  username?: string,
): Promise<ActivityPubActorObject> {
  const actorId = getActorUrl(id).toString();

  return {
    '@context': [
      'https://www.w3.org/ns/activitystreams',
      'https://w3id.org/security/v1',
      activityPubIsGameServerExtension,
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

export const instanceActorUsername = 'merchant';

export async function getInstanceActor() {
  const serverState = await drizz.query.serverState.findFirst();
  if (serverState === undefined) {
    throw new Error('Server state not found.');
  }

  const { instanceId, publicKey, privateKey } = serverState;

  const actor = await getActorFromId(
    { id: instanceId, publicKey },
    SupportedActorType.Application,
    instanceActorUsername,
  );

  return {
    actor,
    internalId: instanceId,
    privateKey,
  };
}
