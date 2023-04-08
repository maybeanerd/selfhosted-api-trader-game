import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { HelloWorldModule } from '@/modules/helloworld/helloworld.module';
import { TradeModule } from '@/modules/trade/trade.module';

@Module({
  imports: [ScheduleModule.forRoot(), HelloWorldModule, TradeModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
