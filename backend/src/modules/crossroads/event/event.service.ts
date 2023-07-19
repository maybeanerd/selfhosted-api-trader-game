import { Injectable } from '@nestjs/common';
import { StoredEvent } from './schemas/Event.schema';
import {
  Event,
  EventType,
  TradeOfferAcceptedEventPayload,
  TradeOfferCreatedEventPayload,
  TradeOfferRemovedEventPayload,
} from './types';
import { EventDto, EventsInputDto } from './dto/Event.dto';
// import { HttpService } from '@nestjs/axios';
import { TreatyService } from '@/modules/treaty/treaty.service';
import { crossroadsEventPath } from '@/config/apiPaths';
import { HttpService } from '@nestjs/axios';
import { TradeService } from '@/modules/trade/trade.service';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';

function mapStoredEventDocumentToEventDto(
  storedEvent: StoredEvent,
  instanceId: string,
): EventDto {
  return {
    id: storedEvent.id,
    type: storedEvent.type,
    payload: storedEvent.payload,
    createdOn: storedEvent.createdOn.toISOString(),
    sourceInstanceId: storedEvent.remoteInstanceId ?? instanceId, // if it's a local event, the source is this instance
  };
}

@Injectable()
export class EventService {
  constructor(
    @InjectModel(StoredEvent)
    private eventModel: typeof StoredEvent,
    private readonly treatyService: TreatyService,
    private readonly httpService: HttpService,
    private readonly tradeService: TradeService,
  ) {}

  async postEventsToTreatiedInstances(events: Array<EventDto>): Promise<void> {
    const serverState = await this.treatyService.ensureServerId();
    const treaties = await this.treatyService.getAllTreaties();
    await Promise.all(
      treaties.map(async (treaty) => {
        console.log('Posting events to treaty', treaty, events);
        // Do not send events that originated from that instance
        const filteredEvents = events.filter(
          (event) => event.sourceInstanceId !== treaty.instanceId,
        );
        if (filteredEvents.length === 0) {
          return true;
        }

        const body: EventsInputDto = {
          sourceInstanceId: serverState.instanceId,
          events: filteredEvents,
        };

        const url = treaty.url + crossroadsEventPath;
        try {
          await this.httpService.post(url, body).toPromise();
        } catch {
          // TODO maybe add retry logic later on, or track treaties that failed to post
          console.log('Failed to post events to treaty', treaty);
          return false;
        }
        return true;
      }),
    );
  }

  async getEventsOfTimeframe(
    sourceInstanceId: string,
    from: Date,
    to?: Date,
  ): Promise<Array<EventDto>> {
    const events = await this.eventModel.findAll({
      where: {
        receivedOn: { [Op.gte]: from, [Op.lte]: to },
        remoteInstanceId: { [Op.ne]: sourceInstanceId },
      },
    });

    const serverState = await this.treatyService.ensureServerId();

    return events.map((event) =>
      mapStoredEventDocumentToEventDto(event, serverState.instanceId),
    );
  }

  /** For internal use to add events that we want to share. */
  async createEvent(event: Omit<Event, 'id'>) {
    const createdOn = new Date();
    const createdEvent = await this.eventModel.create({
      type: event.type,
      payload: event.payload,
      createdOn,
      receivedOn: createdOn,
    });

    const serverState = await this.treatyService.ensureServerId();

    await this.postEventsToTreatiedInstances([
      mapStoredEventDocumentToEventDto(createdEvent, serverState.instanceId),
    ]);
  }

  async addEvents(eventsInput: EventsInputDto): Promise<boolean> {
    const sourceInstanceId = eventsInput.sourceInstanceId;
    const treatyIsValid = await this.treatyService.hasActiveTreaty(
      sourceInstanceId,
    );
    if (!treatyIsValid) {
      return false;
    }

    const receivedOn = new Date();

    const createdEvents = await this.eventModel.bulkCreate(
      eventsInput.events.map((e) => ({
        id: e.id,
        type: e.type,
        createdOn: e.createdOn,
        payload: e.payload,
        remoteInstanceId: e.sourceInstanceId,
        receivedOn,
      })),
    );

    const serverState = await this.treatyService.ensureServerId();

    await this.handleEvents(createdEvents);

    await this.postEventsToTreatiedInstances(
      createdEvents.map((createdEvent) =>
        mapStoredEventDocumentToEventDto(createdEvent, serverState.instanceId),
      ),
    );

    return true;
  }

  async handleEvents(events: Array<StoredEvent>) {
    await Promise.all(
      events.map(async (event) => {
        console.log('Handling event', event);

        if (event.type === EventType.TradeOfferRemoved) {
          const payload = event.payload as TradeOfferRemovedEventPayload;
          await this.tradeService.removeTradeOffer(payload.id);
          return;
        }

        if (event.type === EventType.TradeOfferCreated) {
          const payload = event.payload as TradeOfferCreatedEventPayload;
          await this.tradeService.receiveTradeOffer(payload);
          return;
        }

        if (event.type === EventType.TradeOfferAccepted) {
          const payload = event.payload as TradeOfferAcceptedEventPayload;
          await this.tradeService.acceptTradeOffer(payload.id);
          return;
        }

        console.error('Unhandled event type', event);
      }),
    );
  }
}
