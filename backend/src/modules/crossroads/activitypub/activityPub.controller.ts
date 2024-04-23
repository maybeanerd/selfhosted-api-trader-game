import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ActivityPubService } from './activityPub.service';

import { crossroadsActivityPubBasePath } from '@/config/apiPaths';
import {
  ActivityPubActor,
  PublicKeyObject,
  getPublicKeyOfActor,
} from '@/modules/crossroads/activitypub/actor';
import { apiVersion } from '@/modules/crossroads/activitypub/utils/apUrl';

// TODO

@Controller({ path: crossroadsActivityPubBasePath, version: apiVersion })
export class ActivityPubController {
  constructor(private readonly activityPubService: ActivityPubService) {}

  // TODO DTOs

  @Get('/actors/:id')
  async getActorById(@Param('id') id: string): Promise<ActivityPubActor> {
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
    console.log('getNoteById', id);
    // TODO
    throw new HttpException('Not implemented', HttpStatus.NOT_IMPLEMENTED);
  }

  @Get('/activities/:id')
  async getActivityById(@Param('id') id: string): Promise<unknown> {
    console.log('getActivityById', id);
    // TODO
    throw new HttpException('Not implemented', HttpStatus.NOT_IMPLEMENTED);
  }

  @Get('/outbox')
  async getOutbox(): Promise<unknown> {
    // TODO
    throw new HttpException('Not implemented', HttpStatus.NOT_IMPLEMENTED);
  }

  @Post('/inbox')
  async postToInbox(): Promise<unknown> {
    // TODO
    throw new HttpException('Not implemented', HttpStatus.NOT_IMPLEMENTED);
  }
}
