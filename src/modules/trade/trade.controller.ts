import { Body, Controller, Get } from '@nestjs/common';
import { TradeService } from '@/modules/trade/trade.service';
import { TakeResourceResponse } from './dto/takeResourceResponse';
import { TakeResourceQuery } from './dto/takeResourceQuery';

@Controller({ path: 'trade', version: '1' })
export class TradeController {
  constructor(private readonly tradeService: TradeService) {}

  @Get()
  takeResource(@Body() query: TakeResourceQuery): TakeResourceResponse {
    return this.tradeService.getResource(query.type, query.amount);
  }
}
