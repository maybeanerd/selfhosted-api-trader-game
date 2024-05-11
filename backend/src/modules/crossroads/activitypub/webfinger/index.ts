import { getBaseUrl } from '@/modules/crossroads/activitypub/utils/apUrl';
import { contentType } from '@/modules/crossroads/activitypub/utils/contentType';
import type { APActor } from 'activitypub-types';

export type WebfingerResponse = {
  subject: string;
  links: Array<{
    rel: 'self';
    type: 'application/activity+json';
    href: string;
  }>;
};

export function mapActorToWebfingerResponse(actor: APActor): WebfingerResponse {
  if (actor.id === undefined) {
    throw new Error('Actor ID is undefined');
  }
  return {
    subject: `acct:${actor.preferredUsername}@${getBaseUrl()}`,
    links: [
      {
        rel: 'self',
        type: contentType,
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
