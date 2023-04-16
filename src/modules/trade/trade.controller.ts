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
import { IdDto } from '@/dto/Id.dto';

@Controller({ path: 'trade', version: '1' })
export class TradeController {
  constructor(private readonly tradeService: TradeService) {}

  @Get()
  getTradeOffers(): Promise<Array<TradeOfferDto>> {
    return this.tradeService.getAllTradeOffers();
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
