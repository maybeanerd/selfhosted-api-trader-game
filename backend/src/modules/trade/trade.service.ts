import { Injectable } from '@nestjs/common';
import { ResourceType } from '@/modules/resource/types';
import { ResourceService } from '@/modules/resource/resource.service';
import { TradeOfferDto } from './dto/TradeOffer.dto';
import { NewTrade, Trade, trade } from 'db/schema';
import { drizz } from 'db';
import { and, eq } from 'drizzle-orm';
import { ActivityPubService } from '@/modules/crossroads/activitypub/activityPub.service';

function mapTradeDocumentToTradeOfferDto(t: Trade): TradeOfferDto {
  return {
    id: t.id,
    offeredResources: t.offeredResources,
    requestedResources: t.requestedResources,
    creatorId: t.creatorId,
  };
}

@Injectable()
export class TradeService {
  constructor(
    private readonly resourceService: ResourceService,
    private readonly activityPubService: ActivityPubService,
  ) {}

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

      const tradeMessageContent = `A user (${creatorId}) offers 
${JSON.stringify(offeredTrade.offeredResources, null, 2)}
for
${JSON.stringify(offeredTrade.requestedResources, null, 2)}.`;

      const noteId = await this.activityPubService.createNoteObject(
        creatorId,
        tradeMessageContent,
        {
          requestedResources: offeredTrade.requestedResources,
          offeredResources: offeredTrade.offeredResources,
        },
      );

      const newTradeOffer: NewTrade = {
        ...offeredTrade,
        creatorId,
        activityPubNoteId: noteId,
      };

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
    activityPubNoteId: string,
    receivedTrade: {
      id: string;
      creatorId: string;
      requestedResources: Array<{ type: ResourceType; amount: number }>;
      offeredResources: Array<{ type: ResourceType; amount: number }>;
    },
  ): Promise<void> {
    const newTradeOffer: NewTrade = {
      ...receivedTrade,
      activityPubNoteId,
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

        // Only share deletion if the trade was created by a user on this instance
        await this.activityPubService.deleteNoteObject(
          tradeOfferToRemove.activityPubNoteId,
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

        // Only share acceptance if the trade was accepted by a user on this instance
        await this.activityPubService.likeNoteObject(
          tradeOfferToRemove.activityPubNoteId,
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
