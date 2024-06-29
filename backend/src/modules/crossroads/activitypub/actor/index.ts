import {
  ActivityPubActorObject,
  SupportedActorType,
} from '@/modules/crossroads/activitypub/actor/types';
import {
  getActorPublicKeyUrl,
  getActorUrl,
  getFollowersUrl,
  getFollowingUrl,
  getInboxUrl,
  getOutboxUrl,
} from '@/modules/crossroads/activitypub/utils/apUrl';
import { serverInfo } from '@/config/serverInfo';
import { activityPubIsGameServerExtension } from '@/modules/crossroads/activitypub/utils/gameServerExtension';
import { drizz } from 'db';

const gitHubProjectUrl = new URL(
  'https://github.com/maybeanerd/selfhosted-api-trader-game',
);

function getHtmlLink(url: URL) {
  return `<a href="${url.toString()}">${url.toString()}</a>`;
}

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
    summary: `Actor in charge of handling trades between players for the game server ${getHtmlLink(serverInfo.baseUrl)}.
For more information about the game itself, check out ${getHtmlLink(gitHubProjectUrl)}.`,
    icon: {
      type: 'Image',
      mediaType: 'image/png',
      url:
        gitHubProjectUrl.toString() +
        '/blob/main/backend/src/modules/crossroads/activitypub/assets/merchant-profile-picture.png',
    },
    // image: ...  // Banner image, if we wanted it

    inbox: getInboxUrl().toString(),
    outbox: getOutboxUrl().toString(),
    followers: getFollowersUrl().toString(),
    following: getFollowingUrl().toString(),

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
