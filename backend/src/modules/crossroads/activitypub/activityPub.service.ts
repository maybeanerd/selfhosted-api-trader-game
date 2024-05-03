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
  ActivityPubActor,
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
import {
  getActivityUrl,
  getNoteUrl,
} from '@/modules/crossroads/activitypub/utils/apUrl';
import { ActivityPubActivityQueueType } from 'db/schemas/ActivityPubActivityQueue.schema';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  inboxActivity,
  activityPubActorDto,
  publicKeyDto,
} from '@/modules/crossroads/activitypub/dto/Inbox.dto';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { z } from 'zod';

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
  constructor(
    private readonly httpService: HttpService,
    /* private readonly treatyService: TreatyService,
    private readonly httpService: HttpService,
    private readonly tradeService: TradeService, */
  ) {}

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

  /**
   * Fetch actor data from their instance.
   */
  async getRemoteActor(actorId: string): Promise<NewActivityPubActor | null> {
    try {
      const url = new URL(actorId);
      const remoteActor = (
        await lastValueFrom(
          this.httpService.get(url.toString(), {
            headers: {
              Accept: 'application/activity+json',
            },
          }),
        )
      ).data;
      const validation = await activityPubActorDto.safeParseAsync(remoteActor);
      if (validation.success === false) {
        return null;
      }

      // TODO figure this out baesed on either actor context or game server API (server info)
      const isGameServer = false;

      const receivedActor = validation.data;

      const receivedPublicKey = receivedActor.publicKey;

      if (typeof receivedPublicKey === 'string') {
        const publicKeyUrl = new URL(receivedPublicKey);
        const publicKey = (
          await lastValueFrom(
            this.httpService.get(publicKeyUrl.toString(), {
              headers: {
                Accept: 'application/activity+json',
              },
            }),
          )
        ).data;

        const validatePublicKey = await publicKeyDto.safeParseAsync(publicKey);
        if (validatePublicKey.success === false) {
          return null;
        }

        return {
          ...receivedActor,
          publicKeyId: validatePublicKey.data.id,
          publicKeyPem: validatePublicKey.data.publicKeyPem,
          isGameServer,
        };
      }

      return {
        ...receivedActor,
        publicKeyId: receivedPublicKey.id,
        publicKeyPem: receivedPublicKey.publicKeyPem,
        isGameServer,
      };
    } catch {
      return null;
    }
  }

  /**
   * Ensure an actor exists in this instance, either loading the existing one or falling back to fetching them
   */
  async ensureRemoteActor(actorId: string): Promise<ActivityPubActor | null> {
    const existingActor = await drizz.query.activityPubActor.findFirst({
      where: (actor) => eq(actor.id, actorId),
    });

    if (existingActor !== undefined) {
      return existingActor;
    }

    const remoteActor = await this.getRemoteActor(actorId);

    if (remoteActor === null) {
      return null;
    }
    await drizz.insert(activityPubActor).values(remoteActor);

    return remoteActor;
  }

  async importActorFromWebfinger(
    instanceBaseUrl: string,
  ): Promise<ActivityPubActor | null> {
    const instanceUrl = new URL(instanceBaseUrl);
    const instanceHost = instanceUrl.host;
    const actorName = `${instanceActorUsername}@${instanceHost}`;

    const webfingerUrl = new URL('.well-known/webfinger', instanceBaseUrl);

    const foundActor = (
      await lastValueFrom(
        this.httpService.get(webfingerUrl.toString(), {
          params: { resource: `acct:${actorName}` },
        }),
      )
    ).data;

    const foundActorValidation = await z
      .object({
        subject: z.string(),
        links: z.array(
          z.object({
            rel: z.string(),
            type: z.string(),
            href: z.string(),
          }),
        ),
      })
      .safeParseAsync(foundActor);

    if (!foundActorValidation.success) {
      console.error('Failed to find actor of instance. (webfinger failed)');
      return null;
    }

    const actor = foundActorValidation.data.links.find(
      (link) =>
        link.rel === 'self' && link.type === 'application/activity+json',
    );

    if (actor === undefined) {
      console.error(
        'Failed to find actor of instance. (webfinger doesnt contain self ref)',
      );
      return null;
    }

    const knownActor = await this.ensureRemoteActor(actor.href);

    if (knownActor === null) {
      console.error('Failed to find actor of instance. (actor not found)');
      return null;
    }

    return knownActor;
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
      where: (o) => eq(o.internalId, id),
    });

    if (apObject === undefined) {
      return null;
    }

    return mapActivityPubObjectToDto(apObject);
  }

  async followActor(actorId: string): Promise<void> {
    await drizz.transaction(async (transaction) => {
      const receivedOn = new Date();

      const id = randomUUID();

      const newActivityPubActivity: NewActivityPubActivity = {
        id: getActivityUrl(id).toString(),
        internalId: id,
        receivedOn,
        type: SupportedActivityType.Follow,
        actor: (await getInstanceActor()).actor.id,
        object: actorId,
      };

      await transaction
        .insert(activityPubActivity)
        .values(newActivityPubActivity);

      await transaction.insert(activityPubActivityQueue).values({
        id: newActivityPubActivity.id,
        type: ActivityPubActivityQueueType.Outgoing,
        objectWasStored: true,
      });
    });
  }

  async unfollowActor(actorId: string): Promise<void> {
    await drizz.transaction(async (transaction) => {
      const receivedOn = new Date();

      const instanceActorId = (await getInstanceActor()).actor.id;

      const followActivity =
        await transaction.query.activityPubActivity.findFirst({
          where: (activity) =>
            and(
              eq(activity.actor, instanceActorId),
              eq(activity.object, actorId),
              eq(activity.type, SupportedActivityType.Follow),
            ),
        });

      if (followActivity === undefined) {
        throw new Error('Cant unfollow actor that was not followed before.');
      }

      const id = randomUUID();

      const newActivityPubActivity: NewActivityPubActivity = {
        id: getActivityUrl(id).toString(),
        internalId: id,
        receivedOn,
        type: SupportedActivityType.Undo,
        actor: instanceActorId,
        object: followActivity.id,
        /** This allows us to send the activity to their inbox
         * without needing to re-calculate the target actor
         * based on the original activity
         */
        target: actorId,
      };

      await transaction
        .insert(activityPubActivity)
        .values(newActivityPubActivity);

      await transaction.insert(activityPubActivityQueue).values({
        id: newActivityPubActivity.id,
        type: ActivityPubActivityQueueType.Outgoing,
        objectWasStored: true,
      });
    });
  }

  async createNoteObject(
    actorId: string,
    content: string,
    gameContent: unknown = {}, // TODO define this type
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
        gameContent,
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
        objectWasStored: true,
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
        objectWasStored: true,
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

  // TODO paginationand start date
  async getOutbox(): Promise<Array<APRoot<APActivity>>> {
    const { actor } = await getInstanceActor();
    const activities = await drizz.query.activityPubActivity.findMany({
      where: (activity) => eq(activity.actor, actor.id),
      orderBy: (activity) => asc(activity.receivedOn),
      limit: 100,
    });

    return activities.map(mapActivityPubActivityToDto);
  }

  async handleInbox(activities: Array<unknown>): Promise<void> {
    await drizz.transaction(async (transaction) => {
      await Promise.all(
        activities.map(async (activity) => {
          const receivedOn = new Date();

          const validation = await inboxActivity.safeParseAsync(activity);
          if (validation.success === false) {
            console.info(
              'Got unsupported activity. Ignoring. ->\n',
              JSON.stringify(activity, null, 2),
              validation.error,
            );
            return;
          }

          const validatedActivity = validation.data;

          const actordId =
            typeof validatedActivity.actor === 'string'
              ? validatedActivity.actor
              : validatedActivity.actor.id;

          const objectId =
            typeof validatedActivity.object === 'string'
              ? validatedActivity.object
              : validatedActivity.object.id;

          const newActivityPubActivity: NewActivityPubActivity = {
            id: validatedActivity.id,
            receivedOn,
            type: validatedActivity.type,
            actor: actordId,
            object: objectId,
          };

          const remoteActor = await this.ensureRemoteActor(actordId);
          if (remoteActor === null) {
            throw new Error('Failed to receive remote actor');
          }

          // TODO validate the original inbox request with the actor's public key

          await transaction
            .insert(activityPubActivity)
            .values(newActivityPubActivity);

          // If the activity already includes the object it relates to,
          // we don't need to fetch it later on and can immediately store it
          let objectWasStored = false;

          // We only store the object if it was manipulated. Otherwise we can just reference it.
          if (
            typeof validatedActivity.object !== 'string' &&
            (validatedActivity.type === SupportedActivityType.Create ||
              validatedActivity.type === SupportedActivityType.Update)
          ) {
            objectWasStored = true; // We can't use this value for the if-clause, since type narrowing won't work
            const newObject: NewActivityPubObject = {
              id: validatedActivity.object.id,
              internalId: randomUUID(),
              type: validatedActivity.object.type,
              published: new Date(validatedActivity.object.published),
              attributedTo:
                typeof validatedActivity.object.attributedTo === 'string'
                  ? validatedActivity.object.attributedTo
                  : validatedActivity.object.attributedTo.id,
              content: validatedActivity.object.content,
              gameContent: validatedActivity.object.gameContent,
              inReplyTo:
                typeof validatedActivity.object.inReplyTo === 'string'
                  ? validatedActivity.object.inReplyTo
                  : validatedActivity.object.inReplyTo?.id,
              to: validatedActivity.object.to,
            };
            await transaction.insert(activityPubObject).values(newObject);
          }

          await transaction.insert(activityPubActivityQueue).values({
            id: newActivityPubActivity.id,
            type: ActivityPubActivityQueueType.Incoming,
            objectWasStored,
          });
        }),
      );
    });
  }
}
