import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ActivityPubService } from './activityPub.service';

import { WebfingerResponse } from '@/modules/crossroads/activitypub/webfinger';

// This is not part of the ActivityPub controller since it needs to be at the root of the API

@Controller({ path: '.well-known' })
export class WellKnownController {
  constructor(private readonly activityPubService: ActivityPubService) {}

  // TODO DTOs
  @Get('/webfinger')
  async useWebfinger(
    @Query('resource') subject: `acct:${string}@${string}`,
  ): Promise<WebfingerResponse> {
    const response =
      await this.activityPubService.findActorWithWebfinger(subject);
    if (!response) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return response;
  }
}
