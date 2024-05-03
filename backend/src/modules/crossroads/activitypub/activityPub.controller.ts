import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ActivityPubService } from './activityPub.service';
import { crossroadsActivityPubBasePath } from '@/config/apiPaths';
import { getPublicKeyOfActor } from '@/modules/crossroads/activitypub/actor';
import type {
  ActivityPubActorObject,
  PublicKeyObject,
} from '@/modules/crossroads/activitypub/actor/types';
import { apiVersion } from '@/modules/crossroads/activitypub/utils/apUrl';
import type { APActivity, APRoot } from 'activitypub-types';
import { z } from 'zod';

@Controller({ path: crossroadsActivityPubBasePath, version: apiVersion })
export class ActivityPubController {
  constructor(private readonly activityPubService: ActivityPubService) {}

  // TODO DTOs and validate them

  @Get('/actors/:id')
  async getActorById(@Param('id') id: string): Promise<ActivityPubActorObject> {
    const actor = await this.activityPubService.findActorById(id);
    if (!actor) {
      throw new HttpException('Actor not found', HttpStatus.NOT_FOUND);
    }
    return actor;
  }

  @Get('/actors/:id/publicKey')
  async getActorPublicKeyById(
    @Param('id') id: string,
  ): Promise<PublicKeyObject> {
    const publicKey = await getPublicKeyOfActor(id);
    return publicKey;
  }

  @Get('/notes/:id')
  async getNoteById(@Param('id') id: string): Promise<unknown> {
    const note = await this.activityPubService.findObjectById(id);
    if (!note) {
      throw new HttpException('Note not found', HttpStatus.NOT_FOUND);
    }
    return note;
  }

  @Get('/activities/:id')
  async getActivityById(@Param('id') id: string): Promise<unknown> {
    const activity = await this.activityPubService.findActivityById(id);
    if (!activity) {
      throw new HttpException('Activity not found', HttpStatus.NOT_FOUND);
    }
    return activity;
  }

  @Get('/outbox')
  async getOutbox(): Promise<Array<APRoot<APActivity>>> {
    // TODO pagination
    const outbox = await this.activityPubService.getOutbox();

    return outbox;
  }

  @Post('/inbox')
  async postToInbox(@Body() body: Array<APRoot<APActivity>>): Promise<void> {
    try {
      const validatedBody = await z.array(z.unknown()).parseAsync(body);
      await this.activityPubService.handleInbox(validatedBody);
    } catch (e: unknown) {
      console.error(e);
      throw new HttpException('Invalid Input', HttpStatus.BAD_REQUEST);
    }
  }
}
