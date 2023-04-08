import { Controller, Get, Query } from '@nestjs/common';
import { TradeService } from '@/modules/trade/trade.service';

@Controller({ path: 'trade', version: '1' })
export class TradeController {
  constructor(private readonly appService: TradeService) {}

  @Get()
  getResource(@Query('given') resourceName: string) {
    return this.appService.getResource(resourceName, {
      name: 'stone',
      amount: 69,
    });
  }
}
