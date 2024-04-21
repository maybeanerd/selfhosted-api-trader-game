import { crossroadsActivityPubBasePath } from '@/config/apiPaths';

const baseUrl = 'https://trading-game.diluz.io'; // TODO get from env somehow

const activityPubBaseUrl = `${baseUrl}/${crossroadsActivityPubBasePath}`;

export function getBaseUrl(): string {
  return baseUrl;
}

export function getActorUrl(actorId: string): URL {
  return new URL(`${activityPubBaseUrl}/actors/${actorId}`);
}

export function getActorPublicKeyUrl(actorId: string): URL {
  return new URL(`${activityPubBaseUrl}/actors/${actorId}/publicKey`);
}

export function getNoteUrl(noteId: string): URL {
  return new URL(`${activityPubBaseUrl}/notes/${noteId}`);
}

export function getActivityUrl(actionId: string): URL {
  return new URL(`${activityPubBaseUrl}/activities/${actionId}`);
}

export function getInboxUrl(): URL {
  return new URL(`${activityPubBaseUrl}/inbox`);
}

export function getOutboxUrl(): URL {
  return new URL(`${activityPubBaseUrl}/outbox`);
}
