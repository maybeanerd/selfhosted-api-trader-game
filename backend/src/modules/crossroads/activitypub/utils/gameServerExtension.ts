const activityPubGameServerExtensionBaseUrl =
  'https://github.com/maybeanerd/selfhosted-api-trader-game#';

export const activityPubIsGameServerExtension =
  activityPubGameServerExtensionBaseUrl + 'isGameServer';

export const activityPubGameContentExtension = {
  gameContent: activityPubGameServerExtensionBaseUrl + 'gameContent',
};

export function comesFromGameServer(object: Record<string, unknown>): boolean {
  const context = object['@context'];
  if (Array.isArray(context)) {
    return context.includes(activityPubIsGameServerExtension);
  }
  return context === activityPubIsGameServerExtension;
}
