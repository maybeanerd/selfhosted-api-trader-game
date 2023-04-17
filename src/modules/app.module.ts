import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TradeModule } from '@/modules/trade/trade.module';
import { ResourceModule } from '@/modules/resource/resource.module';
import { MongooseModule } from '@nestjs/mongoose';
import { dbConfig } from '@/config/dbConfig';
import { TreatyModule } from '@/modules/treaty/treaty.module';
import { CrossroadsModule } from '@/modules/crossroads/crossroads.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongooseModule.forRoot(`mongodb://${dbConfig.host}:27017`, {
      dbName: 'nest',
    }),

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
