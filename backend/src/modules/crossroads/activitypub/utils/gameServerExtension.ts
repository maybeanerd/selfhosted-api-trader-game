import type { APRoot, APObject } from 'activitypub-types';

export const activityPubGameServerExtension =
  'https://github.com/maybeanerd/selfhosted-api-trader-game#isGameServer';

export function comesFromGameServer(object: APRoot<APObject>): boolean {
  const context = object['@context'];
  if (Array.isArray(context)) {
    return context.includes(activityPubGameServerExtension);
  }
  return context === activityPubGameServerExtension;
}
