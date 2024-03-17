import { Module } from '@nestjs/common';
import { TreatyController } from './treaty/crossroads.treaty.controller';
import { EventController } from './event/event.controller';
import { EventService } from './event/event.service';
import { HttpModule } from '@nestjs/axios';
import { TradeModule } from '@/modules/trade/trade.module';
import { TreatyModule } from '@/modules/treaty/treaty.module';

@Module({
  imports: [HttpModule, TreatyModule, TradeModule],

  controllers: [TreatyController, EventController],
  providers: [EventService],
})
export class CrossroadsModule {}
