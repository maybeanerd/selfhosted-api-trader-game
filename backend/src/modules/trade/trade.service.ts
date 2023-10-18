import { Injectable } from '@nestjs/common';
import { ResourceType } from '@/modules/resource/types';
import { ResourceService } from '@/modules/resource/resource.service';
import { TradeOfferDto } from './dto/TradeOffer.dto';
import { Trade } from '@/modules/trade/schemas/Trade.schema';
import { InjectModel } from '@nestjs/sequelize';
import { WhereOptions, CreationAttributes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';

function mapTradeDocumentToTradeOfferDto(trade: Trade): TradeOfferDto {
  return {
    id: trade.id,
    offeredResources: trade.offeredResources,
    requestedResources: trade.requestedResources,
    creatorId: trade.creatorId,
    isLocal: trade.remoteInstanceId === null,
  };
}

@Injectable()
export class TradeService {
  constructor(
    private readonly resourceService: ResourceService,
    @InjectModel(Trade)
    private tradeModel: typeof Trade,
    private sequelize: Sequelize,
  ) {}

  async getAllTradeOffers(): Promise<Array<TradeOfferDto>> {
    const trades = await this.tradeModel.findAll();

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
        creatorId,
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

  async receiveTradeOffer(
    receivedTrade: {
      id: string;
      creatorId: string;
      requestedResources: Array<{ type: ResourceType; amount: number }>;
      offeredResources: Array<{ type: ResourceType; amount: number }>;
    },
    remoteInstanceId: string | null
  ): Promise<void> {
    const tradeOfferToCreate:CreationAttributes<Trade> = {
      ...receivedTrade,
      remoteInstanceId,
    };
    const trade = new this.tradeModel(tradeOfferToCreate);
    await trade.save();
  }

  async removeTradeOffer(
    id: string,
    requestingUserId?: string,
  ): Promise<TradeOfferDto | null> {
    return this.sequelize.transaction(async (transaction) => {
      const query: WhereOptions<Trade> = { id };
      if (requestingUserId) {
        query.creatorId = requestingUserId;
      }

      const tradeOfferToRemove = await this.tradeModel.findOne({
        where: query,
        transaction,
      });

      if (tradeOfferToRemove === null) {
        return null;
      }

      if (requestingUserId) {
        const resourcesToReturn = tradeOfferToRemove.offeredResources.map(
          (resource) => ({
            type: resource.type,
            amount: Math.floor(resource.amount * 0.8),
          }),
        );

        await this.resourceService.addAmountsOfResources(
          resourcesToReturn,
          requestingUserId,
          transaction,
        );
      }
      await tradeOfferToRemove.destroy({ transaction });

      return mapTradeDocumentToTradeOfferDto(tradeOfferToRemove);
    });
  }

  async acceptTradeOffer(
    tradeOfferId: string,
    acceptantId?: string,
  ): Promise<TradeOfferDto | null> {
    return this.sequelize.transaction(async (transaction) => {
      const tradeOfferToRemove = await this.tradeModel.findOne({
        where: { id: tradeOfferId },
        transaction,
      });

      if (tradeOfferToRemove === null) {
        return null;
      }

      if (acceptantId) {
        const resourcesToPay = tradeOfferToRemove.requestedResources;
        const wasAbleToPay = await this.resourceService.takeAmountsOfResources(
          resourcesToPay,
          acceptantId,
          transaction,
        );
        if (!wasAbleToPay) {
          throw new Error('Missing resources to complete the trade.');
        }

        await this.resourceService.addAmountsOfResources(
          tradeOfferToRemove.offeredResources,
          acceptantId,
          transaction,
        );
      }

      await tradeOfferToRemove.destroy({ transaction });

      // TODO give resources that have been received to the originally offering player as well

      return mapTradeDocumentToTradeOfferDto(tradeOfferToRemove);
    });
  }
}
