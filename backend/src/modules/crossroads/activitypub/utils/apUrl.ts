import { crossroadsBasePath, apiBasePath } from '@/config/apiPaths';
import { serverInfo } from '@/config/serverInfo';

export const apiVersion = '1';

const { baseUrl } = serverInfo;

const activityPubBaseUrl = `${baseUrl.toString()}${apiBasePath}/v${apiVersion}/${crossroadsBasePath}`;

export function getHost(): string {
  return baseUrl.host;
}

export function getActorUrl(actorId: string): URL {
  return new URL(`${activityPubBaseUrl}/actors/${actorId}`);
}

export function getActorPublicKeyUrl(actorId: string): URL {
  return new URL(`${activityPubBaseUrl}/actors/${actorId}#main-key`);
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
