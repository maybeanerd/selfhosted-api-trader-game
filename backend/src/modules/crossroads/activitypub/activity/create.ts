import { getActivityUrl } from '@/modules/crossroads/activitypub/utils/apUrl';
import type { APCreate, APObject, APRoot } from 'activitypub-types';
import { randomUUID } from 'crypto';

function generateActivityId(): string {
  const uuid = randomUUID();

  const url = getActivityUrl(uuid);
  return url.toString();
}

export function createCreateActivity(
  actorId: string,
  object: APRoot<APObject>,
): APRoot<APCreate> {
  const createActivity: APRoot<APCreate> = {
    '@context': 'https://www.w3.org/ns/activitystreams',

    id: generateActivityId(),
    type: 'Create',
    actor: actorId,

    object,
  };

  return createActivity;
}
