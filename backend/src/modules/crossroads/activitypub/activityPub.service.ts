import { Injectable } from '@nestjs/common';
import {
  ActivityPubActor,
  getInstanceActor,
  instanceActorUsername,
} from '@/modules/crossroads/activitypub/actor';
import {
  WebfingerResponse,
  WebfingerSubject,
  getUsernameFromWebfingerSubject,
  mapActorToWebfingerResponse,
} from '@/modules/crossroads/activitypub/webfinger';
import type { APActivity, APObject, APRoot } from 'activitypub-types';
import { drizz } from 'db';
import { eq } from 'drizzle-orm';
import {
  ActivityPubActivity,
  ActivityPubObject,
  NewActivityPubActivity,
  NewActivityPubObject,
  activityPubActivity,
  activityPubObject,
} from 'db/schema';
import { SupportedObjectType } from '@/modules/crossroads/activitypub/object';
import {
  SupportedActivityType,
  createActivity,
} from '@/modules/crossroads/activitypub/activity';
import { randomUUID } from 'crypto';
import { getNoteUrl } from '@/modules/crossroads/activitypub/utils/apUrl';

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

  async findActorById(id: string): Promise<ActivityPubActor | null> {
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
        receivedOn,
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
        handled: true,
      };

      await transaction
        .insert(activityPubActivity)
        .values(newActivityPubActivity);
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
}
