import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TradeModule } from '@/modules/trade/trade.module';
import { ResourceModule } from '@/modules/resource/resource.module';
import { TreatyModule } from '@/modules/treaty/treaty.module';
import { CrossroadsModule } from '@/modules/crossroads/crossroads.module';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    // Cron module
    ScheduleModule.forRoot(),

    // Logger module
    LoggerModule.forRoot(),

    // Modules for clients
    TradeModule,
    ResourceModule,
    TreatyModule,

    // Module for inter instance communication
    CrossroadsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
