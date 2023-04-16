import { Injectable } from '@nestjs/common';
import { StoredEvent } from './schemas/Event.schema';
import { Event } from './types';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventsInputDto } from './dto/Event.dto';

@Injectable()
export class EventService {
  constructor(
    @InjectModel(StoredEvent.name)
    private eventModel: Model<StoredEvent>,
  ) {}

  async getEventsOfTimeframe(sourceInstanceId: string, from: Date, to?: Date) {
    console.log(sourceInstanceId, from, to);
    // TODO
  }

  /** For internal use to add events that we want to share. */
  async createEvent(event: Omit<Event, 'id'>) {
    await this.eventModel.create({ type: event.type, payload: event.payload });
    // TODO already post to other instances from here, or via cronjob?
  }

  async addEvents(eventsInput: EventsInputDto) {
    const sourceInstanceId = eventsInput.sourceInstanceId;
    console.log(sourceInstanceId);
    // TODO validate the source instance ID

    await this.eventModel.insertMany(eventsInput.events);

    // TODO post to other instances

    // TODO actually do something with these events, like add/remove/update trades
  }
}
