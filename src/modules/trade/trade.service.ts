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
    creatorId: trade.creatorId,
    isLocal: trade.remoteInstanceId === undefined,
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

  async createTradeOffer(
    offeredTrade: {
      requestedResources: Array<{ type: ResourceType; amount: number }>;
      offeredResources: Array<{ type: ResourceType; amount: number }>;
    },
    creatorId: string,
  ): Promise<TradeOfferDto | null> {
    const couldReserveAllResources =
      await this.resourceService.takeAmountsOfResources(
        offeredTrade.offeredResources,
      );

    if (!couldReserveAllResources) {
      return null;
    }

    const trade = new this.tradeModel({
      ...offeredTrade,
      creatorId,
    });

    await trade.save();

    return mapTradeDocumentToTradeOfferDto(trade);
  }

  async receiveTradeOffer(receivedTrade: {
    id: string;
    creatorId: string;
    requestedResources: Array<{ type: ResourceType; amount: number }>;
    offeredResources: Array<{ type: ResourceType; amount: number }>;
  }): Promise<void> {
    const trade = new this.tradeModel(receivedTrade);
    await trade.save();
  }

  async removeTradeOffer(
    id: string,
    requestingUserId?: string,
  ): Promise<TradeOfferDto | null> {
    return transaction(this.connection, async (session) => {
      // TODO check if requestingUserId is creatorId
      console.log(requestingUserId);
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

  async acceptTradeOffer(
    tradeOfferId: string,
    acceptantId?: string,
  ): Promise<TradeOfferDto | null> {
    return transaction(this.connection, async (session) => {
      const removedTradeOffer = await this.tradeModel
        .findOneAndDelete({ id: tradeOfferId })
        .session(session)
        .exec();

      if (removedTradeOffer === null) {
        return null;
      }

      const resourcesToPay = removedTradeOffer.requestedResources;

      const wasAbleToPay = await this.resourceService.takeAmountsOfResources(
        resourcesToPay,
        session,
      );
      if (!wasAbleToPay) {
        throw new Error('Missing resources to complete the trade.');
      }

      if (acceptantId) {
        // TODO use id to assign resources to the acceptant
        await this.resourceService.addAmountsOfResources(
          removedTradeOffer.offeredResources,
          session,
        );
      }

      // TODO give resources that have been received to the originally offering player as well

      return mapTradeDocumentToTradeOfferDto(removedTradeOffer);
    });
  }
}
