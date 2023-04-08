import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { HelloWorldModule } from '@/modules/helloworld/helloworld.module';
import { TradeModule } from '@/modules/trade/trade.module';
import { ResourceModule } from '@/modules/resource/resource.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    HelloWorldModule,
    TradeModule,
    ResourceModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
