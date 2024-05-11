import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ActivityPubService } from './activityPub.service';
import { WebfingerResponse } from '@/modules/crossroads/activitypub/webfinger';
import {
  NodeInfoDto,
  Protocol,
} from '@/modules/crossroads/activitypub/dto/nodeInfo.dto';
import { serverInfo } from '@/config/serverInfo';
import { drizz } from 'db';
import { and, count, eq, isNotNull } from 'drizzle-orm';
import { activityPubActivity } from 'db/schema';
import { SupportedActivityType } from '@/modules/crossroads/activitypub/activity';

// This is not part of the ActivityPub controller since it needs to be at the root of the API

@Controller({ path: '.well-known' })
export class WellKnownController {
  constructor(private readonly activityPubService: ActivityPubService) {}

  @Get('/nodeinfo')
  async getNodeInfo(): Promise<NodeInfoDto> {
    const createActivityCount = await drizz
      .select({ count: count() })
      .from(activityPubActivity)
      .where(
        and(
          eq(activityPubActivity.type, SupportedActivityType.Create),
          isNotNull(activityPubActivity.internalId),
        ),
      );

    const localPosts = createActivityCount[0].count;

    const usage = {
      users: {
        total: 1,
        activeHalfyear: 1,
        activeMonth: 1,
      },
      localPosts,
      localComments: 0,
    };

    return {
      version: '2.1',
      software: {
        name: serverInfo.softwareName,
        version: serverInfo.version,
        repository: serverInfo.sourceUrl,
        homepage: serverInfo.sourceUrl,
      },
      protocols: [Protocol.ActivityPub],
      services: {
        inbound: [],
        outbound: [],
      },
      openRegistrations: false,
      usage,
      metadata: {},
    };
  }

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
