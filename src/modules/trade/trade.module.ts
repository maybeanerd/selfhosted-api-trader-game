import { Module } from '@nestjs/common';
import { TradeController } from '@/modules/trade/trade.controller';
import { TradeService } from '@/modules/trade/trade.service';

@Module({
  imports: [],
  controllers: [TradeController],
  providers: [TradeService],
})
export class TradeModule {}
