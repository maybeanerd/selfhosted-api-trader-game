import { getHost } from '@/modules/crossroads/activitypub/utils/apUrl';
import {
  contentTypeActivityJson,
  contentTypeActivityStreams,
} from '@/modules/crossroads/activitypub/utils/contentType';
import type { APActor } from 'activitypub-types';

export type WebfingerResponse = {
  subject: string;
  aliases?: Array<string>;
  properties?: Record<string, unknown>;
  links: Array<{
    rel: 'self';
    type: typeof contentTypeActivityJson | typeof contentTypeActivityStreams;
    href: string;
  }>;
};

export function mapActorToWebfingerResponse(actor: APActor): WebfingerResponse {
  if (actor.id === undefined) {
    throw new Error('Actor ID is undefined');
  }
  return {
    subject: `acct:${actor.preferredUsername}@${getHost()}`,
    links: [
      {
        rel: 'self',
        type: contentTypeActivityJson,
        href: actor.id,
      },
      {
        rel: 'self',
        type: contentTypeActivityStreams,
        href: actor.id,
      },
    ],
  };
}

export type WebfingerSubject = `acct:${string}@${string}`;

export function getUsernameFromWebfingerSubject(
  subject: WebfingerSubject,
): string | null {
  return subject.replace('acct:', '').split('@').at(0) ?? null;
}
