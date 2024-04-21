import { Module } from '@nestjs/common';
import { TreatyController } from './treaty/crossroads.treaty.controller';
import { EventController } from './event/event.controller';
import { EventService } from './event/event.service';
import { HttpModule } from '@nestjs/axios';
import { TradeModule } from '@/modules/trade/trade.module';
import { TreatyModule } from '@/modules/treaty/treaty.module';
import { ActivityPubService } from '@/modules/crossroads/activitypub/activityPub.service';
import { ActivityPubController } from '@/modules/crossroads/activitypub/activityPub.controller';
import { WellKnownController } from '@/modules/crossroads/activitypub/wellKnown.controller';

@Module({
  imports: [HttpModule, TreatyModule, TradeModule],

  controllers: [
    TreatyController,
    EventController,
    ActivityPubController,
    WellKnownController,
  ],
  providers: [EventService, ActivityPubService],
})
export class CrossroadsModule {}
