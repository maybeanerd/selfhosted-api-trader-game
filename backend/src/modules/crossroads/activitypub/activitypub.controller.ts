import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ActivityPubService } from './activitypub.service';

import { crossroadsActivityPubBasePath } from '@/config/apiPaths';
import { ActivityPubActor } from '@/modules/crossroads/activitypub/actor';

// TODO

@Controller({ path: crossroadsActivityPubBasePath, version: '1' })
export class ActivityPubController {
  constructor(private readonly activityPubService: ActivityPubService) {}

  @Get('/actors/:id')
  // TODO validate param?
  async getActorById(@Param('id') id: string): Promise<ActivityPubActor> {
    const actor = await this.activityPubService.findActorById(id);
    if (!actor) {
      throw new HttpException('Actor not found', HttpStatus.NOT_FOUND);
    }
    return actor;
  }
}
