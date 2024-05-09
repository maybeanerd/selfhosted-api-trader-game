import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TradeModule } from '@/modules/trade/trade.module';
import { ResourceModule } from '@/modules/resource/resource.module';
import { TreatyModule } from '@/modules/treaty/treaty.module';
import { CrossroadsModule } from '@/modules/crossroads/crossroads.module';
import { InstanceInfoModule } from '@/modules/instanceInfo/instanceInfo.module';
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

    // Modules for inter instance communication
    CrossroadsModule,
    InstanceInfoModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
