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
    const instanceActor = await getInstanceActor();
    if (instanceActor.id !== id) {
      return null;
    }
    return instanceActor;
  }

  async findActorWithWebfinger(
    subject: WebfingerSubject,
  ): Promise<WebfingerResponse | null> {
    const actorName = getUsernameFromWebfingerSubject(subject);
    if (actorName !== instanceActorUsername) {
      return null;
    }

    const instanceActor = await getInstanceActor();
    return mapActorToWebfingerResponse(instanceActor);
  }
}
