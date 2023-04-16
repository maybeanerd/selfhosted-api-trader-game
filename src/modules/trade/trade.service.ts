import { Injectable } from '@nestjs/common';
import { ResourceType } from '@/modules/resource/types';
import { ResourceService } from '@/modules/resource/resource.service';
import { Trade, TradeDocument } from './schemas/Trade.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TradeOfferDto } from './dto/TradeOffer.dto';

function mapTradeDocumentToTradeOfferDto(
  tradeDocument: TradeDocument,
): TradeOfferDto {
  const trade = tradeDocument.toObject();
  return {
    id: trade.id,
    offeredResources: trade.offeredResources,
    requestedResources: trade.requestedResources,
  };
}

@Injectable()
export class TradeService {
  constructor(
    private readonly resourceService: ResourceService,
    @InjectModel(Trade.name)
    private tradeModel: Model<Trade>,
  ) {}

  async createTradeOffer(offeredTrade: {
    requestedResources: Array<{ type: ResourceType; amount: number }>;
    offeredResources: Array<{ type: ResourceType; amount: number }>;
  }): Promise<Trade | null> {
    const couldReserveAllResources =
      await this.resourceService.takeAmountsOfResources(
        offeredTrade.offeredResources,
      );

    if (!couldReserveAllResources) {
      return null;
    }

    const trade = new this.tradeModel(offeredTrade);

    await trade.save();

    return mapTradeDocumentToTradeOfferDto(trade);
  }

  async getAllTradeOffers(): Promise<Array<Trade>> {
    const trades = await this.tradeModel.find();

    return trades.map(mapTradeDocumentToTradeOfferDto);
  }
}
