import { getActivityUrl } from '@/modules/crossroads/activitypub/utils/apUrl';
import type { APObject, APRoot } from 'activitypub-types';
import { randomUUID } from 'crypto';

function generateActivityId(): string {
  const uuid = randomUUID();

  const url = getActivityUrl(uuid);
  return url.toString();
}

export enum SupportedActivityType {
  'Create' = 'Create',
  'Update' = 'Update',
  'Delete' = 'Delete',
  'Follow' = 'Follow',
  'Like' = 'Like',
}

export function isSupportedActivityType(
  type: string,
): type is SupportedActivityType {
  return Object.values(SupportedActivityType).includes(
    type as SupportedActivityType,
  );
}

/* type SupportedActivity = APRoot<
  APCreate | APUpdate | APDelete | APFollow | APLike
>; */

type ActivityPubActivity = {
  '@context': 'https://www.w3.org/ns/activitystreams';
  id: string;
  type: SupportedActivityType;
  actor: string;
  object: APObject & { id: string };
};

export function createActivity<Type extends SupportedActivityType>(
  actorId: string,
  activityType: Type,
  object: APRoot<APObject> & { id: string },
): ActivityPubActivity {
  const activity: ActivityPubActivity = {
    '@context': 'https://www.w3.org/ns/activitystreams',

    id: generateActivityId(),
    type: activityType,
    actor: actorId,

    object,
  };

  return activity;
}

// TODO save and get from DB
