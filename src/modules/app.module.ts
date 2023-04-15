import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TradeModule } from '@/modules/trade/trade.module';
import { ResourceModule } from '@/modules/resource/resource.module';
import { MongooseModule } from '@nestjs/mongoose';
import { dbConfig } from '@/config/dbConfig';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongooseModule.forRoot(`mongodb://${dbConfig.host}:27017`, {
      dbName: 'nest',
    }),

    TradeModule,
    ResourceModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
