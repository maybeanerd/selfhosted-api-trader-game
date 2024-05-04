import { SupportedActivityType } from '@/modules/crossroads/activitypub/activity';
import { ActivityPubActivity } from 'db/schema';

const activityHandlers: Partial<
Record<
SupportedActivityType,
Array<(activity: ActivityPubActivity) => Promise<void> | void>
>
> = {};

export async function handleActivities(
  activities: Array<ActivityPubActivity>,
): Promise<void> {
  console.log('Handling activities', activities);

  for (const activity of activities) {
    const handlers = activityHandlers[activity.type];
    if (handlers === undefined) {
      console.info('No handlers for activity type', activity.type);
      continue;
    }

    await Promise.all(handlers.map((handler) => handler(activity)));
  }
}

export function addActivityHandler<Type extends SupportedActivityType>(
  type: Type,
  handler: (activity: ActivityPubActivity) => Promise<void> | void,
) {
  if (activityHandlers[type] === undefined) {
    activityHandlers[type] = [];
  }
  activityHandlers[type]?.push(handler);
}
