import { Module } from '@nestjs/common';
import { TradeController } from '@/modules/trade/trade.controller';
import { ResourceModule } from '@/modules/resource/resource.module';
import { TradeService } from '@/modules/trade/trade.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Trade } from '@/modules/trade/schemas/Trade.schema';

@Module({
  imports: [ResourceModule, SequelizeModule.forFeature([Trade])],
  controllers: [TradeController],
  providers: [TradeService],
  exports: [TradeService],
})
export class TradeModule {}
