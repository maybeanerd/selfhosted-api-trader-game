import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { TradeService } from '@/modules/trade/trade.service';
import { TradeOfferInputDto } from './dto/TradeOfferInput.dto';
import { TradeOfferDto } from './dto/TradeOffer.dto';
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
  async offerTrade(@Body() body: TradeOfferInputDto): Promise<TradeOfferDto> {
    const createdTrade = await this.tradeService.createTradeOffer(body);
    if (createdTrade === null) {
      throw new HttpException('Not enough resources', HttpStatus.FORBIDDEN);
    }
    return createdTrade;
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
