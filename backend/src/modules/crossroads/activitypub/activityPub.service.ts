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
import type { APActivity, APActor, APObject, APRoot } from 'activitypub-types';
import { drizz } from 'db';
import { and, asc, eq, inArray, isNotNull, desc } from 'drizzle-orm';
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
  storedTreaty,
} from 'db/schema';
import { SupportedObjectType } from '@/modules/crossroads/activitypub/object';
import { SupportedActivityType } from '@/modules/crossroads/activitypub/activity';
import { randomUUID } from 'crypto';
import {
  getActivityUrl,
  getFollowersUrl,
  getFollowingUrl,
  getNoteUrl,
} from '@/modules/crossroads/activitypub/utils/apUrl';
import { ActivityPubActivityQueueType } from 'db/schemas/ActivityPubActivityQueue.schema';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  inboxActivity,
  activityPubActorDto,
  publicKeyDto,
  activityPubObjectDto,
} from '@/modules/crossroads/activitypub/dto/Inbox.dto';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { z } from 'zod';
import {
  HandlerActivityType,
  addActivityFederationHandler,
  handleActivities,
} from '@/modules/crossroads/activitypub/utils/incomingActivityHandler';
import {
  activityPubGameContentExtension,
  activityPubIsGameServerExtension,
  comesFromGameServer,
} from '@/modules/crossroads/activitypub/utils/gameServerExtension';
import { GameContent } from 'db/schemas/ActivityPubObject.schema';
import { contentTypeActivityStreams } from '@/modules/crossroads/activitypub/utils/contentType';
import { createSignedRequestConfig } from '@/modules/crossroads/activitypub/utils/signing';
import { OutboxDto } from '@/modules/crossroads/activitypub/dto/outbox.dto';
import { FollowerDto } from '@/modules/crossroads/activitypub/dto/followers.dto';
import { TreatyStatus } from '@/modules/treaty/types/treatyStatus';

type GameActivityObject = APRoot<APObject> & {
  gameContent: GameContent;
};

function mapActivityPubObjectToDto(
  object: ActivityPubObject,
): GameActivityObject {
  return {
    '@context': [
      'https://www.w3.org/ns/activitystreams',
      activityPubIsGameServerExtension,
      activityPubGameContentExtension,
    ],
    id: object.id,
    type: object.type,
    published: object.published,
    attributedTo: object.attributedTo,
    content: object.content,
    gameContent: object.gameContent,
    inReplyTo: object.inReplyTo ?? undefined,
    to: object.to,
  };
}

function mapActivityPubActorToFollowerDto(
  actor: ActivityPubActor,
): Partial<APRoot<APActor>> {
  return {
    '@context': 'https://www.w3.org/ns/activitystreams',
    id: actor.id,
    type: actor.type,
  };
}

function mapActivityPubActivityToDto(
  activity: ActivityPubActivity,
  object?: ActivityPubObject | null,
): APRoot<APActivity & { object: APRoot<APActivity> }> | null {
  // Handle accept activities differently, inline affected object
  // We assume the accept to be on a follow activity
  if (activity.type === SupportedActivityType.Accept) {
    const { target } = activity;
    if (target === null) {
      console.error('Accept activity without target.', activity);
      return null;
    }
    return {
      '@context': [
        'https://www.w3.org/ns/activitystreams',
        activityPubIsGameServerExtension,
      ],
      id: activity.id,
      type: activity.type,
      actor: activity.actor,
      object: {
        '@context': ['https://www.w3.org/ns/activitystreams'],
        id: activity.object,
        type: SupportedActivityType.Follow,
        actor: target,
        object: activity.actor,
      },
    };
  }

  // Inline created notes, if available
  if (
    activity.type === SupportedActivityType.Create &&
    object !== undefined &&
    object !== null
  ) {
    return {
      '@context': [
        'https://www.w3.org/ns/activitystreams',
        activityPubIsGameServerExtension,
      ],
      id: activity.id,
      type: activity.type,
      actor: activity.actor,
      object: mapActivityPubObjectToDto(object),
    };
  }

  return {
    '@context': [
      'https://www.w3.org/ns/activitystreams',
      activityPubIsGameServerExtension,
    ],
    id: activity.id,
    type: activity.type,
    actor: activity.actor,
    object: activity.object,
  };
}

@Injectable()
export class ActivityPubService {
  constructor(private readonly httpService: HttpService) {
    addActivityFederationHandler(
      HandlerActivityType.Follow,
      this.handleFollowActivity.bind(this),
    );

    addActivityFederationHandler(
      HandlerActivityType.Unfollow,
      this.handleUnfollowActivity.bind(this),
    );

    addActivityFederationHandler(
      HandlerActivityType.Create,
      this.handleCreateActivity.bind(this),
    );
  }

  // TODO at some point consider real workers to take care of this. for now, a cron job is enough
  @Cron(CronExpression.EVERY_10_SECONDS)
  async handleCron() {
    console.time('ap-cron');

    const incomingActivities = (
      await drizz
        .select({
          id: activityPubActivity.id,
          type: activityPubActivity.type,
          actor: activityPubActivity.actor,
          object: activityPubActivity.object,
          internalId: activityPubActivity.internalId,
          receivedOn: activityPubActivity.receivedOn,
          target: activityPubActivity.target,

          isGameServer: activityPubActor.isGameServer,
        })
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
        .innerJoin(
          activityPubActor,
          eq(activityPubActor.id, activityPubActivity.actor),
        )
        .orderBy(asc(activityPubActivityQueue.createdOn))
    ).map(
      ({
        id,
        type,
        actor,
        object,
        internalId,
        receivedOn,
        target,
        isGameServer,
      }) => ({
        activity: {
          type,
          id,
          actor,
          object,
          internalId,
          receivedOn,
          target,
        },
        context: {
          isGameServer,
        },
      }),
    );

    if (incomingActivities.length > 0) {
      await handleActivities(incomingActivities);

      const handledIncomingActivityIds = incomingActivities.map(
        ({ activity }) => activity.id,
      );

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
        .leftJoin(
          activityPubObject,
          eq(activityPubObject.id, activityPubActivity.object),
        )
        .orderBy(asc(activityPubActivityQueue.createdOn))
    ).map((result) => ({
      activity: result.activityPubActivity,
      object: result.activityPubObject,
    }));

    if (outgoingActivities.length > 0) {
      const activitiesToSend =
        // TODO in this map, already inline objects. Could speed up a lot
        outgoingActivities.map((outgoingActivity) =>
          mapActivityPubActivityToDto(
            outgoingActivity.activity,
            outgoingActivity.object,
          ),
        );

      console.log('activitiesToSend:', activitiesToSend);

      const followers = await this.getFollowers();

      console.log('Followers:', followers);

      const treatyTargets = (
        await Promise.all(
          outgoingActivities
            .filter(({ activity: activityToSend }) => {
              // Find follows that we created
              return activityToSend.type === SupportedActivityType.Follow;
              // TODO also send undo follows here?
            })
            .map(async ({ activity: activityToSend }) => {
              const actor = await this.findActorByAPId(activityToSend.object);
              if (actor === null) {
                return null;
              }

              // Don't count followers, they will already receive activities
              if (
                followers.some((follower) => {
                  return follower.id === actor.id;
                })
              ) {
                return null;
              }
              // Get their target actors
              return actor.inbox.toString();
            }),
        )
      ).filter(Boolean) as Array<string>;

      // TODO don't send all activities to all followers.
      await Promise.all(
        activitiesToSend.map(async (activityToSend) => {
          if (activityToSend === null) {
            return;
          }

          await Promise.all(
            followers.map(async (follower) => {
              try {
                const { inbox } = follower;

                await lastValueFrom(
                  this.httpService.post(
                    inbox,
                    activityToSend,
                    await createSignedRequestConfig({
                      body: activityToSend,
                      type: 'post',
                      url: inbox,
                    }),
                  ),
                );
              } catch (e: unknown) {
                console.error(
                  'Failed to send activities to follower',
                  follower,
                  e,
                );
              }
            }),
          );

          // TODO don't send all activities to all treaty partners.
          await Promise.all(
            treatyTargets.map(async (targetInbox) => {
              console.log('targetInbox:', targetInbox);
              try {
                await lastValueFrom(
                  this.httpService.post(
                    targetInbox,
                    activityToSend,
                    await createSignedRequestConfig({
                      body: activityToSend,
                      type: 'post',
                      url: targetInbox,
                    }),
                  ),
                );
              } catch (e: unknown) {
                console.error(
                  'Failed to send activities to targetInbox',
                  targetInbox,
                  e,
                );
              }
            }),
          );
        }),
      );

      const handledOutgoingActivityIds = outgoingActivities.map(
        ({ activity: { id } }) => id,
      );

      await drizz
        .delete(activityPubActivityQueue)
        .where(
          inArray(activityPubActivityQueue.id, handledOutgoingActivityIds),
        );
    }

    console.timeEnd('ap-cron');
  }

  async handleFollowActivity(activity: ActivityPubActivity) {
    // By default, we accept all follows
    await this.acceptFollowActivity(activity.id, activity.actor);
  }

  async handleUnfollowActivity(activity: ActivityPubActivity) {
    await this.updateActorIsFollowing(activity.actor, false);
  }

  async handleCreateActivity(activity: ActivityPubActivity) {
    const existingNote = await drizz.query.activityPubObject.findFirst({
      where: (object) => eq(object.id, activity.object),
    });

    if (existingNote !== undefined) {
      return existingNote;
    }

    return this.fetchAndStoreObject(activity.object);
  }

  /**
   * Fetch actor data from their instance.
   */
  async getRemoteActor(actorId: string): Promise<NewActivityPubActor | null> {
    try {
      const url = new URL(actorId);
      const remoteActor = (
        await lastValueFrom(
          this.httpService.get(
            url.toString(),
            await createSignedRequestConfig({
              type: 'get',
              url,
            }),
          ),
        )
      ).data;

      const validation = await activityPubActorDto.safeParseAsync(remoteActor);

      if (validation.success === false) {
        console.error(
          'Failed to validate actor\n',
          remoteActor,
          '\nwith error\n',
          validation.error,
        );

        return null;
      }

      const receivedActor = validation.data;

      const isGameServer = comesFromGameServer(receivedActor);

      const receivedPublicKey = receivedActor.publicKey;

      if (typeof receivedPublicKey === 'string') {
        const publicKeyUrl = new URL(receivedPublicKey);
        const publicKey = (
          await lastValueFrom(
            this.httpService.get(
              publicKeyUrl.toString(),
              await createSignedRequestConfig({
                type: 'get',
                url: publicKeyUrl,
              }),
            ),
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
    } catch (e: unknown) {
      console.error('Failed to fetch remote actor', e);
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
        this.httpService.get(
          webfingerUrl.toString(),
          await createSignedRequestConfig({
            type: 'get',
            url: webfingerUrl,
            config: {
              params: { resource: `acct:${actorName}` },
            },
          }),
        ),
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
      (link) => link.rel === 'self' && link.type === contentTypeActivityStreams,
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

  async findActorByAPId(id: string): Promise<ActivityPubActor | null> {
    const actor = await drizz.query.activityPubActor.findFirst({
      where: (a) => eq(a.id, id),
    });

    return actor ?? null;
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

  async acceptFollowActivity(
    followActivityId: string,
    activityActorId: string,
  ): Promise<void> {
    await drizz.transaction(async (transaction) => {
      const receivedOn = new Date();

      const internalId = randomUUID();

      const newActivityPubActivity: NewActivityPubActivity = {
        id: getActivityUrl(internalId).toString(),
        internalId,
        receivedOn,
        type: SupportedActivityType.Accept,
        actor: (await getInstanceActor()).actor.id,
        object: followActivityId,
        target: activityActorId,
      };

      await transaction
        .insert(activityPubActivity)
        .values(newActivityPubActivity);

      await transaction.insert(activityPubActivityQueue).values({
        id: newActivityPubActivity.id,
        type: ActivityPubActivityQueueType.Outgoing,
        objectWasStored: true,
      });

      await this.updateActorIsFollowing(activityActorId, true);
    });
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

      // Was never following this actor
      if (followActivity === undefined) {
        return;
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

  async getFollowersCollection(): Promise<FollowerDto> {
    const followers = await drizz.query.activityPubActor.findMany({
      where: (actor) => eq(actor.isFollowingThisServer, true),
      // TODO store and order by follow date
      orderBy: (actor) => desc(actor.id),
    });

    return {
      '@context': 'https://www.w3.org/ns/activitystreams',
      id: getFollowersUrl().toString(),
      summary: 'Followers',
      type: 'OrderedCollection',
      totalItems: followers.length,
      orderedItems: followers.map(mapActivityPubActorToFollowerDto),
    };
  }

  async getFollowingCollection(): Promise<FollowerDto> {
    const followedActors = await drizz
      .select()
      .from(storedTreaty)
      .innerJoin(
        activityPubActor,
        eq(storedTreaty.activityPubActorId, activityPubActor.id),
      )
      .where(
        inArray(storedTreaty.status, [
          // All statuses that indicate we are following them
          TreatyStatus.Signed,
          TreatyStatus.Requested,
          TreatyStatus.Rejected,
        ]),
      )
      .orderBy(desc(storedTreaty.createdOn));

    const following = followedActors.map(
      ({ activityPubActor: actor }) => actor,
    );

    return {
      '@context': 'https://www.w3.org/ns/activitystreams',
      id: getFollowingUrl().toString(),
      summary: 'Following',
      type: 'OrderedCollection',
      totalItems: following.length,
      orderedItems: following.map(mapActivityPubActorToFollowerDto),
    };
  }

  async createNoteObject(
    content: string,
    gameContent: GameContent,
    inReplyTo?: string,
  ): Promise<string> {
    return drizz.transaction(async (transaction) => {
      const receivedOn = new Date();
      const internalNoteId = randomUUID();

      const noteId = getNoteUrl(internalNoteId).toString();
      const { actor } = await getInstanceActor();

      const newActivityPubObject: NewActivityPubObject = {
        id: noteId,
        internalId: internalNoteId,
        type: SupportedObjectType.Note,
        published: receivedOn,
        attributedTo: actor.id,
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
      const internalActivityId = randomUUID();

      const newActivityPubActivity: NewActivityPubActivity = {
        id: getActivityUrl(internalActivityId).toString(),
        internalId: internalActivityId,
        receivedOn,
        type: SupportedActivityType.Create,
        actor: actor.id,
        object: objectId,
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
    userId: string, // TODO use this to validate something?
    objectId: string,
    content: string,
  ): Promise<boolean> {
    return drizz.transaction(async (transaction) => {
      const receivedOn = new Date();

      const { actor } = await getInstanceActor();

      const updatedActivityPubObject = {
        content: content,
      };

      const updatedNotes = await transaction
        .update(activityPubObject)
        .set(updatedActivityPubObject)
        .where(
          and(
            eq(activityPubObject.id, objectId),
            eq(activityPubObject.attributedTo, actor.id),
          ),
        )
        .returning();

      // Found no note to update, which most likely means the note does not belong to the actor
      if (updatedNotes.length === 0) {
        return false;
      }

      const internalId = randomUUID();

      const newActivityPubActivity: NewActivityPubActivity = {
        id: getActivityUrl(internalId).toString(),
        internalId,
        receivedOn,
        type: SupportedActivityType.Update,
        actor: actor.id,
        object: objectId,
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
      const { actor } = await getInstanceActor();
      if (actorId !== actor.id) {
        console.error(
          'Attempted to delete a note that does come from this instance.',
        );
        return false;
      }

      const internalId = randomUUID();

      const newActivityPubActivity: NewActivityPubActivity = {
        id: getActivityUrl(internalId).toString(),
        internalId,
        receivedOn,
        type: SupportedActivityType.Delete,
        actor: actor.id,
        object: existingNote.id,
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
      const { actor } = await getInstanceActor();
      if (noteCreatorId === actor.id) {
        console.error(
          'Attempted to like a note that comes from this instance.',
        );
        return false;
      }

      const internalId = randomUUID();

      const newActivityPubActivity: NewActivityPubActivity = {
        id: getActivityUrl(internalId).toString(),
        internalId,
        receivedOn,
        type: SupportedActivityType.Like,
        actor: actor.id,
        object: existingNote.id,
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

  // TODO pagination and start date
  async getOutbox(): Promise<OutboxDto> {
    const { actor } = await getInstanceActor();
    const activities = await drizz.query.activityPubActivity.findMany({
      where: (activity) =>
        and(
          eq(activity.actor, actor.id),
          isNotNull(activity.internalId),
          // For now, provide only creations in outbox
          inArray(activity.type, [SupportedActivityType.Create]),
        ),
      orderBy: (activity) => desc(activity.receivedOn),
      limit: 100,
    });

    const orderedItems = activities
      .map((activity) => mapActivityPubActivityToDto(activity))
      .filter(Boolean) as Array<APRoot<APActivity>>;

    return {
      '@context': 'https://www.w3.org/ns/activitystreams',
      summary: 'Outbox',
      type: 'OrderedCollection',
      totalItems: orderedItems.length,
      orderedItems,
    };
  }

  async fetchAndStoreObject(
    objectId: string,
  ): Promise<ActivityPubObject | undefined> {
    const object = (
      await lastValueFrom(
        this.httpService.get<APObject>(
          objectId,
          await createSignedRequestConfig({
            type: 'get',
            url: objectId,
          }),
        ),
      )
    ).data;

    const validation = await activityPubObjectDto.safeParseAsync(object);
    if (validation.success === false) {
      console.error(
        'Failed to validate object\n',
        object,
        '\nwith error\n',
        validation.error,
      );
      return;
    }
    const validatedObject = validation.data;

    const newObject: NewActivityPubObject = {
      id: validatedObject.id,
      type: validatedObject.type,
      published: new Date(validatedObject.published),
      attributedTo:
        typeof validatedObject.attributedTo === 'string'
          ? validatedObject.attributedTo
          : validatedObject.attributedTo.id,
      content: validatedObject.content,
      gameContent: validatedObject.gameContent,
      inReplyTo:
        typeof validatedObject.inReplyTo === 'string'
          ? validatedObject.inReplyTo
          : validatedObject.inReplyTo?.id,
      to:
        typeof validatedObject.to === 'string'
          ? validatedObject.to
          : validatedObject.to[0],
    };

    const createdObjects = await drizz
      .insert(activityPubObject)
      .values(newObject)
      .returning();

    return createdObjects.at(0);
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
            if (validatedActivity.object.type !== SupportedObjectType.Note) {
              console.error(
                'Unsupported object type for create/update activity:',
                validatedActivity.object.type,
              );
              return;
            }

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
              to:
                typeof validatedActivity.object.to === 'string'
                  ? validatedActivity.object.to
                  : validatedActivity.object.to[0],
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
