import { Injectable } from '@nestjs/common';
import { StoredEvent, StoredEventDocument } from './schemas/Event.schema';
import { Event } from './types';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventDto, EventsInputDto } from './dto/Event.dto';
// import { HttpService } from '@nestjs/axios';
import { TreatyService } from '@/modules/treaty/treaty.service';

function mapStoredEventDocumentToEventDto(
  storedEvent: StoredEventDocument,
  instanceId: string,
): EventDto {
  return {
    id: storedEvent.id,
    type: storedEvent.type,
    payload: storedEvent.payload,
    createdOn: storedEvent.createdOn,
    sourceInstanceId: storedEvent.remoteInstanceId ?? instanceId, // if it's a local event, the source is this instance
  };
}

@Injectable()
export class EventService {
  constructor(
    @InjectModel(StoredEvent.name)
    private eventModel: Model<StoredEvent>,
    private readonly treatyService: TreatyService,
    // private readonly httpService: HttpService,
  ) {}

  async getEventsOfTimeframe(
    sourceInstanceId: string,
    from: Date,
    to?: Date,
  ): Promise<Array<EventDto>> {
    const events = await this.eventModel.find({
      receivedOn: { $gte: from, $lte: to },
      remoteInstanceId: { $ne: sourceInstanceId },
    });

    const serverState = await this.treatyService.ensureServerId();

    return events.map((event) =>
      mapStoredEventDocumentToEventDto(event, serverState.instanceId),
    );
  }

  /** For internal use to add events that we want to share. */
  async createEvent(event: Omit<Event, 'id'>) {
    const createdOn = new Date();
    await this.eventModel.create({
      type: event.type,
      payload: event.payload,
      createdOn,
      receivedOn: createdOn,
    });
    // TODO already post to other instances from here, or via cronjob?
  }

  async addEvents(eventsInput: EventsInputDto) {
    const sourceInstanceId = eventsInput.sourceInstanceId;
    console.log(sourceInstanceId);
    // TODO validate the source instance ID

    const receivedOn = new Date();

    await this.eventModel.insertMany(
      eventsInput.events.map((e) => ({ ...e, receivedOn })),
    );

    // TODO post to other instances

    // TODO actually do something with these events, like add/remove/update trades
  }
}
