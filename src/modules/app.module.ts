import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TradeModule } from '@/modules/trade/trade.module';
import { ResourceModule } from '@/modules/resource/resource.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TradeModule,
    ResourceModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
