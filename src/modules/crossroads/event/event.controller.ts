import { Body, Controller, Get, Post } from '@nestjs/common';
import { EventService } from './event.service';
import {
  EventDto,
  EventsInputDto,
  EventsOfTimeframeDto,
} from './dto/Event.dto';
import { IdDto } from '@/dto/Id.dto';

@Controller({ path: 'crossroads/event', version: '1' })
export class EventController {
  // GET a list of events from a specific date on, maybe even filter by type of event later on?
  // POST events that this server should be aware of
  constructor(private readonly eventService: EventService) {}

  @Get()
  async getAllRecentEvents(@Body() body: IdDto): Promise<EventsOfTimeframeDto> {
    // TODO
    console.log(body.id); // This is the id of the instance that wants to see events. We could filter out their own events, or even verify if we want to answer this instance.
    const events = new Array<EventDto>();
    return { events, from: new Date(), to: new Date() };
  }

  @Post()
  async receiveEvents(@Body() body: EventsInputDto): Promise<void> {
    await this.eventService.addEvents(body);
  }
}
