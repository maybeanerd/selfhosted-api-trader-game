import { Injectable } from '@nestjs/common';
import { ResourceType } from '@/modules/resource/types';
import { ResourceService } from '@/modules/resource/resource.service';
import { Trade, TradeDocument } from './schemas/Trade.schema';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { TradeOfferDto } from './dto/TradeOffer.dto';
import { transaction } from '@/util/mongoDbTransaction';

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
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async getAllTradeOffers(): Promise<Array<TradeOfferDto>> {
    const trades = await this.tradeModel.find();

    return trades.map(mapTradeDocumentToTradeOfferDto);
  }

  async createTradeOffer(offeredTrade: {
    requestedResources: Array<{ type: ResourceType; amount: number }>;
    offeredResources: Array<{ type: ResourceType; amount: number }>;
  }): Promise<TradeOfferDto | null> {
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

  async removeTradeOffer(id: string): Promise<TradeOfferDto | null> {
    return transaction(this.connection, async (session) => {
      const removedTradeOffer = await this.tradeModel
        .findOneAndDelete({ id })
        .session(session)
        .exec();

      if (removedTradeOffer === null) {
        return null;
      }

      const resourcesToReturn = removedTradeOffer.offeredResources.map(
        (resource) => ({
          type: resource.type,
          amount: Math.floor(resource.amount * 0.8),
        }),
      );

      await this.resourceService.addAmountsOfResources(
        resourcesToReturn,
        session,
      );

      return mapTradeDocumentToTradeOfferDto(removedTradeOffer);
    });
  }
}
