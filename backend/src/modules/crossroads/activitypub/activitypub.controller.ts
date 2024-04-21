import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ActivityPubService } from './activityPub.service';

import { crossroadsActivityPubBasePath } from '@/config/apiPaths';
import { ActivityPubActor } from '@/modules/crossroads/activitypub/actor';
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
}
