import { Body, Controller, Delete, Get, Post, Put } from '@nestjs/common';
import { TradeService } from '@/modules/trade/trade.service';
import { TradeOfferInput } from './dto/tradeOfferInput';
import { TradeOffer } from './dto/tradeOffer';
import { randomUUID } from 'crypto';
import { Id } from '@/dto/id.dto';
import { Resource } from '@/modules/resource/types';

@Controller({ path: 'trade', version: '1' })
export class TradeController {
  constructor(private readonly tradeService: TradeService) {}

  @Get()
  getTradeOffers(): Array<TradeOffer> {
    return [
      {
        id: randomUUID(),
        requestedResources: [
          {
            type: Resource.WOOD,
            amount: 10,
          },
        ],
        offeredResources: [
          {
            type: Resource.STONE,
            amount: 10,
          },
        ],
      },
    ];
  }

  @Post()
  offerTrade(@Body() body: TradeOfferInput): TradeOffer {
    // TODO build logic around this

    body.offeredResources.forEach((resource) => {
      this.tradeService.takeResource(resource.type, resource.amount);
    });

    return { ...body, id: randomUUID() };
  }

  @Put()
  acceptTrade(@Body() body: Id): TradeOffer {
    // TODO build logic around this
    return { ...body, requestedResources: [], offeredResources: [] };
  }

  @Delete()
  removeTradeOffer(@Body() body: Id): TradeOffer {
    // TODO build logic around this
    return { ...body, requestedResources: [], offeredResources: [] };
  }
}
