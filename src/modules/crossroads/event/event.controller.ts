import { Body, Controller, Get, Post } from '@nestjs/common';
import { EventService } from './event.service';
import {
  EventsInputDto,
  EventsOfTimeframeDto,
  GetEventsOfTimeframeDto,
} from './dto/Event.dto';

@Controller({ path: 'crossroads/event', version: '1' })
export class EventController {
  // GET a list of events from a specific date on, maybe even filter by type of event later on?
  // POST events that this server should be aware of
  constructor(private readonly eventService: EventService) {}

  @Get()
  async getAllEvents(
    @Body() body: GetEventsOfTimeframeDto,
  ): Promise<EventsOfTimeframeDto> {
    const events = await this.eventService.getEventsOfTimeframe(
      body.id,
      body.from,
      body.to,
    );

    return {
      events,
      from: body.from,
      to: body.to ?? new Date(),
    };
  }

  @Post()
  async receiveEvents(@Body() body: EventsInputDto): Promise<void> {
    await this.eventService.addEvents(body);
  }
}
