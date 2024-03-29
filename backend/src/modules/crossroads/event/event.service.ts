import { Injectable } from '@nestjs/common';
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
import { StoredEvent, storedEvent } from 'db/schema';
import { drizz } from 'db';

function mapStoredEventDocumentToEventDto(
  event: StoredEvent,
  instanceId: string,
): EventDto {
  return {
    id: event.id,
    type: event.type,
    payload: event.payload,
    createdOn: event.createdOn.toISOString(),
    sourceInstanceId: event.remoteInstanceId ?? instanceId, // if it's a local event, the source is this instance
  };
}

@Injectable()
export class EventService {
  constructor(
    private readonly treatyService: TreatyService,
    private readonly httpService: HttpService,
    private readonly tradeService: TradeService,
  ) {}

  async postEventsToTreatiedInstances(events: Array<EventDto>): Promise<void> {
    const serverId = await this.treatyService.ensureServerId();
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
          sourceInstanceId: serverId,
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
    to: Date = new Date(),
  ): Promise<Array<EventDto>> {
    const events = await drizz.query.storedEvent.findMany({
      where: (event, { ne, and, between }) =>
        and(
          ne(event.remoteInstanceId, sourceInstanceId),
          between(event.receivedOn, from, to),
        ),
    });

    const serverId = await this.treatyService.ensureServerId();

    return events.map((event) =>
      mapStoredEventDocumentToEventDto(event, serverId),
    );
  }

  /** For internal use to add events that we want to share. */
  async createEvent(event: Omit<Event, 'id'>) {
    const createdOn = new Date();
    const createdEvents = await drizz
      .insert(storedEvent)
      .values({
        type: event.type,
        payload: event.payload,
        createdOn,
        receivedOn: createdOn,
      })
      .returning();

    const createdEvent = createdEvents.at(0);
    if (!createdEvent) {
      // TODO refine error handling here
      throw new Error('Failed to insert.');
    }

    const serverId = await this.treatyService.ensureServerId();

    await this.postEventsToTreatiedInstances([
      mapStoredEventDocumentToEventDto(createdEvent, serverId),
    ]);
  }

  async addEvents(eventsInput: EventsInputDto): Promise<boolean> {
    const sourceInstanceId = eventsInput.sourceInstanceId;
    const treatyIsValid =
      await this.treatyService.hasActiveTreaty(sourceInstanceId);
    if (!treatyIsValid) {
      return false;
    }

    const receivedOn = new Date();

    const createdEvents = await drizz
      .insert(storedEvent)
      .values(
        eventsInput.events.map((event) => ({
          id: event.id,
          type: event.type,
          createdOn: new Date(event.createdOn),
          payload: event.payload,
          remoteInstanceId: event.sourceInstanceId,
          receivedOn,
        })),
      )
      .returning();

    const serverId = await this.treatyService.ensureServerId();

    await this.handleEvents(createdEvents);

    await this.postEventsToTreatiedInstances(
      createdEvents.map((createdEvent) =>
        mapStoredEventDocumentToEventDto(createdEvent, serverId),
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
          await this.tradeService.receiveTradeOffer(
            payload,
            event.remoteInstanceId,
          );
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
