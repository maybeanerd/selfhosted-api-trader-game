import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TradeModule } from '@/modules/trade/trade.module';
import { ResourceModule } from '@/modules/resource/resource.module';
import { TreatyModule } from '@/modules/treaty/treaty.module';
import { CrossroadsModule } from '@/modules/crossroads/crossroads.module';
import { SequelizeModule } from '@nestjs/sequelize';
import { dbConfig } from '@/config/dbConfig';
import { schemas } from '@/modules/schemas';

@Module({
  imports: [
    // Cron module
    ScheduleModule.forRoot(),

    // Database module
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: dbConfig.host,
      port: 5432,
      username: 'root',
      password: 'root',
      database: 'nest',
      models: schemas,
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
