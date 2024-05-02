import { Injectable } from '@nestjs/common';
import {
  getInstanceActor,
  instanceActorUsername,
} from '@/modules/crossroads/activitypub/actor';
import { type ActivityPubActorObject } from '@/modules/crossroads/activitypub/actor/types';
import {
  WebfingerResponse,
  WebfingerSubject,
  getUsernameFromWebfingerSubject,
  mapActorToWebfingerResponse,
} from '@/modules/crossroads/activitypub/webfinger';
import type { APActivity, APObject, APRoot } from 'activitypub-types';
import { drizz } from 'db';
import { and, asc, eq } from 'drizzle-orm';
import {
  ActivityPubActivity,
  ActivityPubObject,
  NewActivityPubActivity,
  NewActivityPubActor,
  NewActivityPubObject,
  activityPubActivity,
  activityPubActivityQueue,
  activityPubActor,
  activityPubObject,
} from 'db/schema';
import { SupportedObjectType } from '@/modules/crossroads/activitypub/object';
import {
  SupportedActivityType,
  createActivity,
} from '@/modules/crossroads/activitypub/activity';
import { randomUUID } from 'crypto';
import { getNoteUrl } from '@/modules/crossroads/activitypub/utils/apUrl';
import { ActivityPubActivityQueueType } from 'db/schemas/ActivityPubActivityQueue.schema';
import { Cron, CronExpression } from '@nestjs/schedule';
import { inboxActivity } from '@/modules/crossroads/activitypub/dto/Inbox.dto';

function mapActivityPubObjectToDto(object: ActivityPubObject): APObject {
  return {
    id: object.id,
    type: object.type,
    published: object.published,
    attributedTo: object.attributedTo,
    content: object.content,
    inReplyTo: object.inReplyTo ?? undefined,
    to: object.to,
  };
}

function mapActivityPubActivityToDto(
  activity: ActivityPubActivity,
): APRoot<APActivity> {
  return {
    '@context': 'https://www.w3.org/ns/activitystreams',
    id: activity.id,
    type: activity.type,
    actor: activity.actor,
    object: activity.object,
  };
}

@Injectable()
export class ActivityPubService {
  /* constructor(
    private readonly treatyService: TreatyService,
    private readonly httpService: HttpService,
    private readonly tradeService: TradeService,
  ) {} */

  // TODO at some point consider real workers to take care of this. for now, a cron job is enough
  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    console.time('ap-cron');

    const activitiesToProcess =
      await drizz.query.activityPubActivityQueue.findMany({
        where: (queue) => eq(queue.type, ActivityPubActivityQueueType.Incoming),
        orderBy: (queue) => asc(queue.createdOn),
      });

    // TODO process the activities (e.g. create or update game resources like trades or treaties)
    console.log('Activities to process:', activitiesToProcess);

    const activitiesToSend =
      await drizz.query.activityPubActivityQueue.findMany({
        where: (queue) => eq(queue.type, ActivityPubActivityQueueType.Outgoing),
        orderBy: (queue) => asc(queue.createdOn),
      });

    // TODO send the activities to the appropriate actors
    console.log('Activities to send:', activitiesToSend);

    console.timeEnd('ap-cron');
  }

  async findActorById(id: string): Promise<ActivityPubActorObject | null> {
    const { actor, internalId } = await getInstanceActor();
    if (internalId !== id) {
      return null;
    }
    return actor;
  }

  async findActorWithWebfinger(
    subject: WebfingerSubject,
  ): Promise<WebfingerResponse | null> {
    const actorName = getUsernameFromWebfingerSubject(subject);
    if (actorName !== instanceActorUsername) {
      return null;
    }

    const { actor } = await getInstanceActor();
    return mapActorToWebfingerResponse(actor);
  }

  async findObjectById(id: string): Promise<APObject | null> {
    const apObject = await drizz.query.activityPubObject.findFirst({
      where: (o) => eq(o.id, id),
    });

    if (apObject === undefined) {
      return null;
    }

    return mapActivityPubObjectToDto(apObject);
  }

  async createNoteObject(
    actorId: string,
    content: string,
    inReplyTo?: string,
  ): Promise<void> {
    await drizz.transaction(async (transaction) => {
      const receivedOn = new Date();
      const internalId = randomUUID();

      const newActivityPubObject: NewActivityPubObject = {
        id: getNoteUrl(internalId).toString(),
        internalId: internalId, // TODO use this to create the trade offer? Or pass the id of the trade offer into here instead
        type: SupportedObjectType.Note,
        published: receivedOn,
        attributedTo: actorId,
        content: content,
        inReplyTo: inReplyTo,
        to: 'https://www.w3.org/ns/activitystreams#Public',
      };

      const createdObjects = await transaction
        .insert(activityPubObject)
        .values(newActivityPubObject)
        .returning();

      const createdObject = createdObjects.at(0);
      if (createdObject === undefined) {
        throw new Error('Failed creating object');
      }

      const objectId = createdObject.id;
      const createdActivity = createActivity(
        actorId,
        SupportedActivityType.Create,
        { id: objectId },
      );
      const newActivityPubActivity: NewActivityPubActivity = {
        id: createdActivity.id,
        receivedOn,
        type: createdActivity.type,
        actor: createdActivity.actor,
        object: createdActivity.object.id,
      };

      await transaction
        .insert(activityPubActivity)
        .values(newActivityPubActivity);

      await transaction.insert(activityPubActivityQueue).values({
        id: newActivityPubActivity.id,
        type: ActivityPubActivityQueueType.Outgoing,
      });
    });
  }

  async updateNoteObject(
    actorId: string,
    objectId: string,
    content: string,
  ): Promise<boolean> {
    return drizz.transaction(async (transaction) => {
      const receivedOn = new Date();

      const updatedActivityPubObject = {
        content: content,
      };

      const updatedNotes = await transaction
        .update(activityPubObject)
        .set(updatedActivityPubObject)
        .where(
          and(
            eq(activityPubObject.id, objectId),
            eq(activityPubObject.attributedTo, actorId),
          ),
        )
        .returning();

      // Found no note to update, which most likely means the note does not belong to the actor
      if (updatedNotes.length === 0) {
        return false;
      }

      const createdActivity = createActivity(
        actorId,
        SupportedActivityType.Update,
        { id: objectId },
      );
      const newActivityPubActivity: NewActivityPubActivity = {
        id: createdActivity.id,
        receivedOn,
        type: createdActivity.type,
        actor: createdActivity.actor,
        object: createdActivity.object.id,
      };

      await transaction
        .insert(activityPubActivity)
        .values(newActivityPubActivity);

      await transaction.insert(activityPubActivityQueue).values({
        id: newActivityPubActivity.id,
        type: ActivityPubActivityQueueType.Outgoing,
      });

      return true;
    });
  }

  async findActivityById(id: string): Promise<APRoot<APActivity> | null> {
    const apActivity = await drizz.query.activityPubActivity.findFirst({
      where: (activity) => eq(activity.id, id),
    });

    if (apActivity === undefined) {
      return null;
    }

    return mapActivityPubActivityToDto(apActivity);
  }

  async receiveActivities(
    activities: Array<APRoot<APActivity>>,
  ): Promise<void> {
    await drizz.transaction(async (transaction) => {
      await Promise.all(
        activities.map(async (activity) => {
          const receivedOn = new Date();

          const validation = await inboxActivity.safeParseAsync(activity);
          if (validation.success === false) {
            console.info(
              'Got unsupported activity. Ignoring. ->\n',
              JSON.stringify(activity, null, 2),
            );
            return;
          }

          const validatedActivity = validation.data;

          const newActivityPubActivity: NewActivityPubActivity = {
            id: validatedActivity.id,
            receivedOn,
            type: validatedActivity.type,
            actor:
              typeof validatedActivity.actor === 'string'
                ? validatedActivity.actor
                : validatedActivity.actor.id,
            object:
              typeof validatedActivity.object === 'string'
                ? validatedActivity.object
                : validatedActivity.object.id,
          };

          await transaction
            .insert(activityPubActivity)
            .values(newActivityPubActivity);

          await transaction.insert(activityPubActivityQueue).values({
            id: newActivityPubActivity.id,
            type: ActivityPubActivityQueueType.Incoming,
          });

          const actorObject =
            typeof validatedActivity.actor === 'string'
              ? null
              : validatedActivity.actor;

          // If we get more than just an actorId and it includes the publicKey, we could store it
          // TODO figure out if we really should. maybe we need to validate the signature of the activity first
          // by going against the actor's publicKey
          if (
            actorObject !== null &&
            typeof actorObject.publicKey !== 'string'
          ) {
            const newActor: NewActivityPubActor = {
              id: actorObject.id,
              type: actorObject.type,
              preferredUsername: actorObject.preferredUsername,
              inbox: actorObject.inbox,
              outbox: actorObject.outbox,
              publicKeyId: actorObject.publicKey.id,
              publicKeyPem: actorObject.publicKey.publicKeyPem,
              // TODO calculate this based on context of the actor type. Does it include a game specific extension?
              isGameServer: false,
            };

            await transaction.insert(activityPubActor).values(newActor);
          }

          // TODO handle objects only being an ID (fetch?) or object (use it)
          if (typeof validatedActivity.object !== 'string') {
            const newObject: NewActivityPubObject = {
              id: validatedActivity.object.id,
              internalId: validatedActivity.object.internalId,
              type: validatedActivity.object.type,
              published: new Date(validatedActivity.object.published),
              attributedTo:
                typeof validatedActivity.object.attributedTo === 'string'
                  ? validatedActivity.object.attributedTo
                  : validatedActivity.object.attributedTo.id,
              content: validatedActivity.object.content,
              inReplyTo:
                typeof validatedActivity.object.inReplyTo === 'string'
                  ? validatedActivity.object.inReplyTo
                  : validatedActivity.object.inReplyTo?.id,
              to: validatedActivity.object.to,
            };
            await transaction.insert(activityPubObject).values(newObject);
          }
        }),
      );
    });
  }
}
