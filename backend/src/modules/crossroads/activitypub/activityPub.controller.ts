import {
  Body,
  Controller,
  Get,
  Header,
  HttpException,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ActivityPubService } from './activityPub.service';
import type { ActivityPubActorObject } from '@/modules/crossroads/activitypub/actor/types';
import { crossroadsBasePath } from '@/config/apiPaths';
import { contentTypeActivityStreams } from '@/modules/crossroads/activitypub/utils/contentType';
import { OutboxDto } from '@/modules/crossroads/activitypub/dto/outbox.dto';

@Controller({ path: crossroadsBasePath })
export class ActivityPubController {
  constructor(private readonly activityPubService: ActivityPubService) {}

  // TODO DTOs and validate them

  @Get('/actors/:id')
  @Header('content-type', contentTypeActivityStreams)
  async getActorById(@Param('id') id: string): Promise<ActivityPubActorObject> {
    const actor = await this.activityPubService.findActorById(id);
    if (!actor) {
      throw new HttpException('Actor not found', HttpStatus.NOT_FOUND);
    }
    return actor;
  }

  @Get('/notes/:id')
  @Header('content-type', contentTypeActivityStreams)
  async getNoteById(@Param('id') id: string): Promise<unknown> {
    const note = await this.activityPubService.findObjectById(id);
    if (!note) {
      throw new HttpException('Note not found', HttpStatus.NOT_FOUND);
    }
    return note;
  }

  @Get('/activities/:id')
  @Header('content-type', contentTypeActivityStreams)
  async getActivityById(@Param('id') id: string): Promise<unknown> {
    const activity = await this.activityPubService.findActivityById(id);
    if (!activity) {
      throw new HttpException('Activity not found', HttpStatus.NOT_FOUND);
    }
    return activity;
  }

  @Get('/outbox')
  @Header('content-type', contentTypeActivityStreams)
  async getOutbox(): Promise<OutboxDto> {
    // TODO pagination
    const outbox = await this.activityPubService.getOutbox();

    return outbox;
  }

  @Post('/inbox')
  @Header('content-type', contentTypeActivityStreams)
  async postToInbox(@Body() body: unknown): Promise<void> {
    const activities = Array.isArray(body) ? body : [body];

    await this.activityPubService.handleInbox(activities);
  }
}
