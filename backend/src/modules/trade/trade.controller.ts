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
import { userIdForTestingResourceGeneration } from '@/modules/resource/utils/testUser';

@Controller({ path: 'trade', version: '1' })
export class TradeController {
  constructor(private readonly tradeService: TradeService) {}

  @Get()
  getTradeOffers(): Promise<Array<TradeOfferDto>> {
    return this.tradeService.getAllTradeOffers();
  }

  @Post()
  async offerTrade(@Body() body: TradeOfferInputDto): Promise<TradeOfferDto> {
    const userId = userIdForTestingResourceGeneration; // TODO get the user id from the request

    const createdTrade = await this.tradeService.createTradeOffer(
      {
        ...body,
      },
      userId,
    );
    if (createdTrade === null) {
      throw new HttpException('Not enough resources.', HttpStatus.FORBIDDEN);
    }
    return createdTrade;
  }

  @Put()
  async acceptTradeOffer(@Body() body: IdDto): Promise<TradeOfferDto> {
    let acceptedTradeOffer: TradeOfferDto | null;
    const userId = userIdForTestingResourceGeneration; // TODO get the user id from the request
    try {
      acceptedTradeOffer = await this.tradeService.acceptTradeOffer(
        body.id,
        userId,
      );
    } catch (e) {
      throw new HttpException(
        'Failed to accept trade offer: ' + e,
        HttpStatus.FORBIDDEN,
      );
    }
    if (acceptedTradeOffer === null) {
      throw new HttpException('Trade offer not found.', HttpStatus.NOT_FOUND);
    }
    return acceptedTradeOffer;
  }

  @Delete()
  async removeTradeOffer(@Body() body: IdDto): Promise<TradeOfferDto> {
    const userId = userIdForTestingResourceGeneration; // TODO get the user id from the request

    const removedTrade = await this.tradeService.removeTradeOffer(
      body.id,
      userId,
    );
    if (removedTrade === null) {
      throw new HttpException('Trade offer not found.', HttpStatus.NOT_FOUND);
    }
    return removedTrade;
  }
}
