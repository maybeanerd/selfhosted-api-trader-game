import { Body, Controller, Delete } from '@nestjs/common';
import { TradeService } from '@/modules/trade/trade.service';
import { TakeResourceResponse } from './dto/takeResourceResponse';
import { TakeResourceBody } from './dto/takeResourceBody';

@Controller({ path: 'trade', version: '1' })
export class TradeController {
  constructor(private readonly tradeService: TradeService) {}

  @Delete()
  removeResource(@Body() body: TakeResourceBody): TakeResourceResponse {
    return this.tradeService.takeResource(body.type, body.amount);
  }
}
