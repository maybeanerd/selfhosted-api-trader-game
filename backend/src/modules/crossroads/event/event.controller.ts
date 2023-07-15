import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { EventService } from './event.service';
import {
  EventsInputDto,
  EventsOfTimeframeDto,
  GetEventsOfTimeframeDto,
} from './dto/Event.dto';
import { crossroadsEventBasePath } from '@/config/apiPaths';

@Controller({ path: crossroadsEventBasePath, version: '1' })
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Get()
  async getAllEvents(
    @Query() query: GetEventsOfTimeframeDto,
  ): Promise<EventsOfTimeframeDto> {
    const from = new Date(query.from);
    const to = query.to ? new Date(query.to) : undefined;
    const events = await this.eventService.getEventsOfTimeframe(
      query.id,
      from,
      to,
    );

    return {
      events,
      from: from,
      to: to ?? new Date(),
    };
  }

  @Post()
  async receiveEvents(@Body() body: EventsInputDto): Promise<void> {
    const addedEvents = await this.eventService.addEvents(body);
    if (!addedEvents) {
      throw new HttpException('Invalid Treaty.', HttpStatus.FORBIDDEN);
    }
  }
}
