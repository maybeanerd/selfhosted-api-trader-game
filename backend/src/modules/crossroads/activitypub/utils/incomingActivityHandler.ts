import { SupportedActivityType } from '@/modules/crossroads/activitypub/activity';
import { getInstanceActor } from '@/modules/crossroads/activitypub/actor';
import { drizz } from 'db';
import { ActivityPubActivity } from 'db/schema';
import { and, eq } from 'drizzle-orm';

// TODO move this entire logic back into the activity service?

/**
 * More specific activity types than the ones activityPub supports,
 * e.g. `Undo` of `Follow` becomes `Unfollow`
 *
 * Also only includes the types that we care about
 */
export enum HandlerActivityType {
  'Follow' = 'Follow',
  'Unfollow' = 'Unfollow',

  'Like' = 'Like',
  'Unlike' = 'Unlike',

  'Create' = 'Create',
  'Delete' = 'Delete',
}

const activityHandlers: Partial<
Record<
HandlerActivityType,
Array<(activity: ActivityPubActivity) => Promise<void> | void>
>
> = {};

async function validateHandlerTypeOfActivity(
  activity: ActivityPubActivity,
): Promise<HandlerActivityType | null> {
  if (activity.type === SupportedActivityType.Create) {
    return HandlerActivityType.Create;
  }
  if (activity.type === SupportedActivityType.Delete) {
    return HandlerActivityType.Delete;
  }

  const instanceActor = await getInstanceActor();
  const instanceActorId = instanceActor.actor.id;

  if (activity.type === SupportedActivityType.Like) {
    // Only handle like activities on objects we created
    const objectToLike = await drizz.query.activityPubObject.findFirst({
      where: (o) =>
        and(eq(o.attributedTo, instanceActorId), eq(o.id, activity.object)),
    });

    if (objectToLike === undefined) {
      console.error('Failed to find object to be liked.');
      return null;
    }

    return HandlerActivityType.Like;
  }

  if (activity.type === SupportedActivityType.Follow) {
    // Only handle follow activities on the instance actor
    if (activity.object !== instanceActorId) {
      return null;
    }
    return HandlerActivityType.Follow;
  }

  if (activity.type === SupportedActivityType.Undo) {
    // Only handle undo activities on activities we created
    const activityToBeUndone = await drizz.query.activityPubActivity.findFirst({
      where: (a) => and(eq(a.actor, activity.actor), eq(a.id, activity.object)),
    });

    if (activityToBeUndone === undefined) {
      console.error('Failed to find activity to be undone.');
      return null;
    }

    if (activityToBeUndone.type === SupportedActivityType.Follow) {
      // Only handle unfollow activities on the instance actor
      if (activityToBeUndone.object !== instanceActorId) {
        return null;
      }
      return HandlerActivityType.Unfollow;
    }

    if (activityToBeUndone.type === SupportedActivityType.Like) {
      // Only handle unlike activities on objects we created
      const objectToUnlike = await drizz.query.activityPubObject.findFirst({
        where: (o) =>
          and(
            eq(o.attributedTo, instanceActorId),
            eq(o.id, activityToBeUndone.object),
          ),
      });

      if (objectToUnlike === undefined) {
        console.error('Failed to find object to be unliked.');
        return null;
      }

      return HandlerActivityType.Unlike;
    }
  }
  return null;
}

export async function handleActivities(
  activities: Array<ActivityPubActivity>,
): Promise<void> {
  console.log('Handling activities', activities);

  for (const activity of activities) {
    const handlerType = await validateHandlerTypeOfActivity(activity);
    if (handlerType === null) {
      console.info('Will not handle activity:', activity);
      continue;
    }

    const handlers = activityHandlers[handlerType];
    if (handlers === undefined) {
      console.info('No handlers for handler type', activity.type);
      continue;
    }

    await Promise.all(handlers.map((handler) => handler(activity)));
  }
}

export function addActivityHandler<Type extends HandlerActivityType>(
  type: Type,
  handler: (activity: ActivityPubActivity) => Promise<void> | void,
) {
  if (activityHandlers[type] === undefined) {
    activityHandlers[type] = [];
  }
  activityHandlers[type]?.push(handler);
}
