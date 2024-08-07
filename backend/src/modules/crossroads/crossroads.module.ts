import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ActivityPubService } from '@/modules/crossroads/activitypub/activityPub.service';
import { ActivityPubController } from '@/modules/crossroads/activitypub/activityPub.controller';
import { WellKnownController } from '@/modules/crossroads/activitypub/wellKnown.controller';

@Module({
  imports: [HttpModule],

  controllers: [ActivityPubController, WellKnownController],
  providers: [ActivityPubService],

  exports: [ActivityPubService],
})
export class CrossroadsModule {}
