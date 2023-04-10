import { Body, Controller, Delete, Get, Post, Put } from '@nestjs/common';
import { TradeService } from '@/modules/trade/trade.service';
import { TradeOfferInputDto } from './dto/TradeOfferInput';
import { TradeOfferDto } from './dto/TradeOffer';
import { randomUUID } from 'crypto';
import { IdDto } from '@/dto/Id.dto';
import { ResourceType } from '@/modules/resource/types';

@Controller({ path: 'trade', version: '1' })
export class TradeController {
  constructor(private readonly tradeService: TradeService) {}

  @Get()
  getTradeOffers(): Array<TradeOfferDto> {
    // TODO build logic around this

    return [
      {
        id: randomUUID(),
        requestedResources: [
          {
            type: ResourceType.WOOD,
            amount: 10,
          },
        ],
        offeredResources: [
          {
            type: ResourceType.STONE,
            amount: 10,
          },
        ],
      },
    ];
  }

  @Post()
  offerTrade(@Body() body: TradeOfferInputDto): TradeOfferDto {
    // TODO build logic around this

    body.offeredResources.forEach((resource) => {
      this.tradeService.takeResource(resource.type, resource.amount);
    });

    return { ...body, id: randomUUID() };
  }

  @Put()
  acceptTradeOffer(@Body() body: IdDto): TradeOfferDto {
    // TODO build logic around this
    return { ...body, requestedResources: [], offeredResources: [] };
  }

  @Delete()
  removeTradeOffer(@Body() body: IdDto): TradeOfferDto {
    // TODO build logic around this
    return { ...body, requestedResources: [], offeredResources: [] };
  }
}
