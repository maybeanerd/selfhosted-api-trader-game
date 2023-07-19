import { Module } from '@nestjs/common';
import { TreatyController } from './treaty/crossroads.treaty.controller';
import { EventController } from './event/event.controller';
import { EventService } from './event/event.service';
import { HttpModule } from '@nestjs/axios';
import { TradeModule } from '@/modules/trade/trade.module';
import { TreatyModule } from '@/modules/treaty/treaty.module';
import { StoredEvent } from '@/modules/crossroads/event/schemas/Event.schema';
import { SequelizeModule } from '@nestjs/sequelize';

@Module({
  imports: [
    SequelizeModule.forFeature([StoredEvent]),
    HttpModule,

    TreatyModule,
    TradeModule,
  ],

  controllers: [TreatyController, EventController],
  providers: [EventService],
})
export class CrossroadsModule {}
