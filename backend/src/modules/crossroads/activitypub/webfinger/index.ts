import { actors } from '@/modules/crossroads/activitypub/actor';
import { getBaseUrl } from '@/modules/crossroads/activitypub/utils/apUrl';
import type { APActor } from 'activitypub-types';

type WebfingerResponse = {
  subject: string;
  links: Array<{
    rel: 'self';
    type: 'application/activity+json';
    href: string;
  }>;
};

function mapActorToWebfingerResponse(actor: APActor): WebfingerResponse {
  if (actor.id === undefined) {
    throw new Error('Actor ID is undefined');
  }
  return {
    subject: `acct:${actor.preferredUsername}@${getBaseUrl()}`,
    links: [
      {
        rel: 'self',
        type: 'application/activity+json',
        href: actor.id,
      },
    ],
  };
}

type WebfingerSubject = `acct:${string}@${string}`;

export function findActorBySubject(
  subject: WebfingerSubject,
): WebfingerResponse | null {
  const actorName = subject.replace('acct:', '').split('@').at(0);
  if (!actorName) {
    return null;
  }

  const foundActor = actors.find((actor) => {
    if (actor.id === undefined) {
      return false;
    }

    const searchedActor = actor.preferredUsername;
    if (searchedActor === null) {
      return false;
    }

    return searchedActor === actorName;
  });

  if (foundActor) {
    return mapActorToWebfingerResponse(foundActor);
  }
  return null;
}
