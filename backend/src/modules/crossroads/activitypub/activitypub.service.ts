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
}
