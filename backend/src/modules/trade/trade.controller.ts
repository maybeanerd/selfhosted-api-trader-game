import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  HttpException,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { TradeService } from '@/modules/trade/trade.service';
import { TradeOfferInputDto } from './dto/TradeOfferInput.dto';
import { TradeOfferDto } from './dto/TradeOffer.dto';
import { getUserId } from '@/modules/resource/utils/testUser';

@Controller({ path: 'trades', version: '1' })
export class TradeController {
  constructor(private readonly tradeService: TradeService) {}

  @Get()
  getTradeOffers(): Promise<Array<TradeOfferDto>> {
    return this.tradeService.getAllTradeOffers();
  }

  @Post()
  async offerTrade(@Body() body: TradeOfferInputDto): Promise<TradeOfferDto> {
    const userId = await getUserId(); // TODO get the user id from the request

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

  @Put('/:id')
  async acceptTradeOffer(@Param('id') id: string): Promise<TradeOfferDto> {
    let acceptedTradeOffer: TradeOfferDto | null;
    const userId = await getUserId(); // TODO get the user id from the request
    try {
      acceptedTradeOffer = await this.tradeService.acceptTradeOffer(id, userId);
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

  @Delete('/:id')
  async removeTradeOffer(@Param('id') id: string): Promise<TradeOfferDto> {
    const userId = await getUserId(); // TODO get the user id from the request

    const removedTrade = await this.tradeService.removeTradeOffer(id, userId);
    if (removedTrade === null) {
      throw new HttpException('Trade offer not found.', HttpStatus.NOT_FOUND);
    }
    return removedTrade;
  }
}
