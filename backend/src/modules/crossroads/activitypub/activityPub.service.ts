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
import { and, asc, eq, inArray, isNotNull } from 'drizzle-orm';
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
import {
  addActivityHandler,
  handleActivities,
} from '@/modules/crossroads/activitypub/utils/incomingActivityHandler';

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
  constructor(private readonly httpService: HttpService) {
    addActivityHandler(
      SupportedActivityType.Follow,
      this.handleFollowActivity.bind(this),
    );
  }

  // TODO at some point consider real workers to take care of this. for now, a cron job is enough
  @Cron(CronExpression.EVERY_10_SECONDS)
  async handleCron() {
    console.time('ap-cron');

    const incomingActivities = (
      await drizz
        .select()
        .from(activityPubActivityQueue)
        .where(
          and(
            eq(
              activityPubActivityQueue.type,
              ActivityPubActivityQueueType.Incoming,
            ),
          ),
        )
        .innerJoin(
          activityPubActivity,
          eq(activityPubActivity.id, activityPubActivityQueue.id),
        )
        .orderBy(asc(activityPubActivityQueue.createdOn))
    ).map((result) => result.activityPubActivity);

    if (incomingActivities.length > 0) {
      await handleActivities(incomingActivities);

      const handledIncomingActivityIds = incomingActivities.map(({ id }) => id);

      await drizz
        .delete(activityPubActivityQueue)
        .where(
          inArray(activityPubActivityQueue.id, handledIncomingActivityIds),
        );
    }

    // TODO start second cronjob for outgoing activities?

    const outgoingActivities = (
      await drizz
        .select()
        .from(activityPubActivityQueue)
        .where(
          and(
            eq(
              activityPubActivityQueue.type,
              ActivityPubActivityQueueType.Outgoing,
            ),
          ),
        )
        .innerJoin(
          activityPubActivity,
          eq(activityPubActivity.id, activityPubActivityQueue.id),
        )
    ).map((result) => result.activityPubActivity);

    if (outgoingActivities.length > 0) {
      const activitiesToSend =
        // TODO in this map, already inline objects. Could speed up a lot
        outgoingActivities.map(mapActivityPubActivityToDto);

      console.log('activitiesToSend:', activitiesToSend);

      const followers = await this.getFollowers();

      console.log('Followers:', followers);

      await Promise.all(
        followers.map(async (follower) => {
          try {
            const { inbox } = follower;

            // TODO HTTP signature
            await lastValueFrom(this.httpService.post(inbox, activitiesToSend));
          } catch (e: unknown) {
            console.error('Failed to send activities to follower', follower, e);
          }
        }),
      );

      const handledOutgoingActivityIds = outgoingActivities.map(({ id }) => id);

      await drizz
        .delete(activityPubActivityQueue)
        .where(
          inArray(activityPubActivityQueue.id, handledOutgoingActivityIds),
        );
    }

    console.timeEnd('ap-cron');
  }

  async handleFollowActivity(activity: ActivityPubActivity) {
    const instanceActor = await getInstanceActor();
    if (
      activity.type !== SupportedActivityType.Follow ||
      activity.object !== instanceActor.actor.id
    ) {
      return;
    }

    await this.updateActorIsFollowing(activity.actor, true);
  }

  async handleUndoActivity(activity: ActivityPubActivity) {
    if (activity.type !== SupportedActivityType.Undo) {
      return;
    }

    const activityToBeUndone = await drizz.query.activityPubActivity.findFirst({
      where: (a) => and(eq(a.actor, activity.actor), eq(a.id, activity.object)),
    });

    if (activityToBeUndone === undefined) {
      console.error('Failed to find activity to be undone');
      return;
    }

    const instanceActor = await getInstanceActor();
    const instanceActorId = instanceActor.actor.id;

    // Case 1: Undoing a follow
    if (
      activityToBeUndone.type === SupportedActivityType.Follow &&
      activityToBeUndone.object === instanceActorId
    ) {
      await this.updateActorIsFollowing(activity.actor, false);

      return;
    }

    // Case 2: Undoing a like
    if (activityToBeUndone.type === SupportedActivityType.Like) {
      // TODO
      return;
    }
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
          isFollowingThisServer: false,
        };
      }

      return {
        ...receivedActor,
        publicKeyId: receivedPublicKey.id,
        publicKeyPem: receivedPublicKey.publicKeyPem,
        isGameServer,
        isFollowingThisServer: false,
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

      const internalId = randomUUID();

      const newActivityPubActivity: NewActivityPubActivity = {
        id: getActivityUrl(internalId).toString(),
        internalId,
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

      const internalId = randomUUID();

      const newActivityPubActivity: NewActivityPubActivity = {
        id: getActivityUrl(internalId).toString(),
        internalId,
        receivedOn,
        type: SupportedActivityType.Undo,
        actor: instanceActorId,
        object: followActivity.id,
        /**
         * This allows us to send the activity to their inbox
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

  async updateActorIsFollowing(
    actorId: string,
    isFollowingThisServer: boolean,
  ): Promise<boolean> {
    const updatedEntries = await drizz
      .update(activityPubActor)
      .set({ isFollowingThisServer })
      .where(eq(activityPubActor.id, actorId));

    return (updatedEntries.rowCount ?? 0) > 0;
  }

  async getFollowers(): Promise<Array<ActivityPubActor>> {
    const followers = await drizz.query.activityPubActor.findMany({
      where: (actor) => eq(actor.isFollowingThisServer, true),
    });

    return followers;
  }

  async createNoteObject(
    actorId: string,
    content: string,
    gameContent: unknown = {}, // TODO define this type
    inReplyTo?: string,
  ): Promise<string> {
    return drizz.transaction(async (transaction) => {
      const receivedOn = new Date();
      const internalId = randomUUID();

      const noteId = getNoteUrl(internalId).toString();

      const newActivityPubObject: NewActivityPubObject = {
        id: noteId,
        internalId,
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

      return noteId;
    });
  }

  // TODO find out if we even need this. Unused atm.
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

  async deleteNoteObject(objectId: string): Promise<boolean> {
    return drizz.transaction(async (transaction) => {
      const receivedOn = new Date();

      const existingNote = await transaction.query.activityPubObject.findFirst({
        where: (object) => eq(object.id, objectId),
      });

      if (existingNote === undefined) {
        return false;
      }

      const actorId = existingNote.attributedTo;
      const instanceActor = await getInstanceActor();
      if (actorId !== instanceActor.actor.id) {
        console.error(
          'Attempted to delete a note that does come from this instance.',
        );
        return false;
      }

      const createdActivity = createActivity(
        instanceActor.actor.id,
        SupportedActivityType.Delete,
        { id: existingNote.id },
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

  async likeNoteObject(objectId: string): Promise<boolean> {
    return drizz.transaction(async (transaction) => {
      const receivedOn = new Date();

      const existingNote = await transaction.query.activityPubObject.findFirst({
        where: (object) => eq(object.id, objectId),
      });

      if (existingNote === undefined) {
        return false;
      }

      const noteCreatorId = existingNote.attributedTo;
      const instanceActor = await getInstanceActor();
      if (noteCreatorId === instanceActor.actor.id) {
        console.error(
          'Attempted to like a note that comes from this instance.',
        );
        return false;
      }

      const createdActivity = createActivity(
        instanceActor.actor.id,
        SupportedActivityType.Like,
        { id: existingNote.id },
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
      where: (activity) => eq(activity.internalId, id),
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
      where: (activity) =>
        and(eq(activity.actor, actor.id), isNotNull(activity.internalId)),
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

          // TODO handle duplicate IDs gracefully, e.g. ignore them

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
