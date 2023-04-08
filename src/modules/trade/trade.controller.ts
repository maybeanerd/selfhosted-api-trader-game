import { Controller, Get, Query } from '@nestjs/common';
import { TradeService } from '@/modules/trade/trade.service';
import { Resource } from '@/modules/resource/types';

@Controller({ path: 'trade', version: '1' })
export class TradeController {
  constructor(private readonly tradeService: TradeService) {}

  @Get()
  getResource(@Query('type') type: Resource, @Query('amount') amount: number) {
    return this.tradeService.getResource(type, amount);
  }
}
