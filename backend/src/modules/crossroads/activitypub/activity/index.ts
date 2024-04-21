import { getActivityUrl } from '@/modules/crossroads/activitypub/utils/apUrl';
import type {
  APCreate,
  APDelete,
  APFollow,
  APLike,
  APObject,
  APRoot,
  APUpdate,
} from 'activitypub-types';
import { randomUUID } from 'crypto';

function generateActivityId(): string {
  const uuid = randomUUID();

  const url = getActivityUrl(uuid);
  return url.toString();
}

type SupportedActivityType = 'Create' | 'Update' | 'Delete' | 'Follow' | 'Like';

type SupportedActivity = APRoot<
APCreate | APUpdate | APDelete | APFollow | APLike
>;

export function createActivity<Type extends SupportedActivityType>(
  actorId: string,
  activityType: Type,
  object: APRoot<APObject>,
): SupportedActivity {
  const activity: SupportedActivity = {
    '@context': 'https://www.w3.org/ns/activitystreams',

    id: generateActivityId(),
    type: activityType,
    actor: actorId,

    object,
  };

  return activity;
}

// TODO save and get from DB
