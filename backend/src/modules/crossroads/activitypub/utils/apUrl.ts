const baseUrl = 'https://trading-game.diluz.io'; // TODO get from env somehow
const pathPrefix = 'ap';

const activityPubBaseUrl = `${baseUrl}/${pathPrefix}`;

export function getBaseUrl(): string {
  return baseUrl;
}

export function getActorUrl(actorId: string): URL {
  return new URL(`${activityPubBaseUrl}/actors/${actorId}`);
}

export function getActorPublicKeyUrl(actorId: string): URL {
  return new URL(`${activityPubBaseUrl}/actors/${actorId}/publicKey`);
}

export function getActorFromActorId(actorId: URL): string | null {
  return actorId.pathname.split('/').pop() ?? null;
}

export function getInboxUrl(): URL {
  return new URL(`${activityPubBaseUrl}/inbox`);
}

export function getOutboxUrl(): URL {
  return new URL(`${activityPubBaseUrl}/outbox`);
}
