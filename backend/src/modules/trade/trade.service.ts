import { Injectable } from '@nestjs/common';
import { ResourceType } from '@/modules/resource/types';
import { ResourceService } from '@/modules/resource/resource.service';
import { TradeOfferDto } from './dto/TradeOffer.dto';
import { NewTrade, Trade, trade } from 'db/schema';
import { drizz } from 'db';
import { and, eq } from 'drizzle-orm';

function mapTradeDocumentToTradeOfferDto(t: Trade): TradeOfferDto {
  return {
    id: t.id,
    offeredResources: t.offeredResources,
    requestedResources: t.requestedResources,
    creatorId: t.creatorId,
    isLocal: t.remoteInstanceId === null,
  };
}

@Injectable()
export class TradeService {
  constructor(private readonly resourceService: ResourceService) {}

  async getAllTradeOffers(): Promise<Array<TradeOfferDto>> {
    const trades = await drizz.query.trade.findMany();

    return trades.map(mapTradeDocumentToTradeOfferDto);
  }

  async createTradeOffer(
    offeredTrade: {
      requestedResources: Array<{ type: ResourceType; amount: number }>;
      offeredResources: Array<{ type: ResourceType; amount: number }>;
    },
    creatorId: string,
  ): Promise<TradeOfferDto | null> {
    return drizz.transaction(async (transaction) => {
      const couldReserveAllResources =
        await this.resourceService.takeAmountsOfResources(
          offeredTrade.offeredResources,
          creatorId,
          transaction,
        );

      if (!couldReserveAllResources) {
        return null;
      }

      const newTradeOffer: NewTrade = { ...offeredTrade, creatorId };

      const createdTrades = await transaction
        .insert(trade)
        .values(newTradeOffer)
        .returning();
      const createdTrade = createdTrades.at(0);

      if (createdTrade === undefined) {
        throw new Error('Could not create trade');
      }

      return mapTradeDocumentToTradeOfferDto(createdTrade);
    });
  }

  async receiveTradeOffer(
    receivedTrade: {
      id: string;
      creatorId: string;
      requestedResources: Array<{ type: ResourceType; amount: number }>;
      offeredResources: Array<{ type: ResourceType; amount: number }>;
    },
    remoteInstanceId: string | null,
  ): Promise<void> {
    const newTradeOffer: NewTrade = {
      ...receivedTrade,
      remoteInstanceId,
    };

    await drizz.insert(trade).values(newTradeOffer);
  }

  async removeTradeOffer(
    id: string,
    requestingUserId?: string,
  ): Promise<TradeOfferDto | null> {
    return drizz.transaction(async (transaction) => {
      const query = requestingUserId
        ? and(eq(trade.id, id), eq(trade.creatorId, requestingUserId))
        : eq(trade.id, id);

      const tradeOfferToRemove = await transaction.query.trade.findFirst({
        where: query,
      });

      if (tradeOfferToRemove === undefined) {
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
      await transaction
        .delete(trade)
        .where(eq(trade.id, tradeOfferToRemove.id));

      return mapTradeDocumentToTradeOfferDto(tradeOfferToRemove);
    });
  }

  async acceptTradeOffer(
    tradeOfferId: string,
    acceptantId?: string,
  ): Promise<TradeOfferDto | null> {
    return drizz.transaction(async (transaction) => {
      const tradeOfferToRemove = await transaction.query.trade.findFirst({
        where: eq(trade.id, tradeOfferId),
      });

      if (tradeOfferToRemove === undefined) {
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

      await transaction
        .delete(trade)
        .where(eq(trade.id, tradeOfferToRemove.id));

      // TODO give resources that have been received to the originally offering player as well

      return mapTradeDocumentToTradeOfferDto(tradeOfferToRemove);
    });
  }
}
