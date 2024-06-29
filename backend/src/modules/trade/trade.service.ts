import { Injectable } from '@nestjs/common';
import { ResourceType } from '@/modules/resource/types';
import { ResourceService } from '@/modules/resource/resource.service';
import { TradeOfferDto } from './dto/TradeOffer.dto';
import { ActivityPubActivity, NewTrade, Trade, trade } from 'db/schema';
import { drizz } from 'db';
import { and, eq } from 'drizzle-orm';
import { ActivityPubService } from '@/modules/crossroads/activitypub/activityPub.service';
import {
  HandlerActivityType,
  HandlerContext,
  addActivityGameLogicHandler,
} from '@/modules/crossroads/activitypub/utils/incomingActivityHandler';
import { GameContent } from 'db/schemas/ActivityPubObject.schema';

function mapTradeDocumentToTradeOfferDto(t: Trade): TradeOfferDto {
  return {
    id: t.id,
    offeredResources: t.offeredResources,
    requestedResources: t.requestedResources,
    creatorId: t.creatorId,
  };
}

function getReadableContentFromGameContent({
  requestedResources,
  offeredResources,
}: GameContent): string {
  let tradeDescription = 'A villager requests to trade ';

  requestedResources.forEach((resource, index) => {
    tradeDescription += `${resource.amount} ${resource.type}`;
    if (index < requestedResources.length - 1) {
      tradeDescription += ', ';
      if (index === requestedResources.length - 2) {
        tradeDescription += 'and ';
      }
    }
  });

  tradeDescription += ', offering ';

  offeredResources.forEach((resource, index) => {
    tradeDescription += `${resource.amount} ${resource.type}`;
    if (index < offeredResources.length - 1) {
      tradeDescription += ', ';
      if (index === offeredResources.length - 2) {
        tradeDescription += 'and ';
      }
    }
  });

  tradeDescription += ' in exchange.';

  return tradeDescription;
}

@Injectable()
export class TradeService {
  constructor(
    private readonly resourceService: ResourceService,
    private readonly activityPubService: ActivityPubService,
  ) {
    addActivityGameLogicHandler(
      HandlerActivityType.Like,
      this.handleLikeActivity.bind(this),
    );

    addActivityGameLogicHandler(
      HandlerActivityType.Create,
      this.handleCreateActivity.bind(this),
    );

    addActivityGameLogicHandler(
      HandlerActivityType.Delete,
      this.handleDeleteActivity.bind(this),
    );
  }

  async handleLikeActivity(activity: ActivityPubActivity) {
    const tradeOffer = await drizz.query.trade.findFirst({
      where: eq(trade.activityPubNoteId, activity.object),
    });

    if (tradeOffer === undefined) {
      console.error('Could not find trade offer for like activity');
      return;
    }

    await this.acceptTradeOffer(tradeOffer.id);
  }

  async handleCreateActivity(
    activity: ActivityPubActivity,
    context: HandlerContext,
  ) {
    if (!context.objectDetails) {
      console.error('No object details found in context');
      return;
    }

    const { gameContent } = context.objectDetails;

    await this.receiveTradeOffer(activity.object, gameContent);
  }

  async handleDeleteActivity(activity: ActivityPubActivity) {
    await drizz
      .delete(trade)
      .where(eq(trade.activityPubNoteId, activity.object));
  }

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

      const tradeMessageContent =
        getReadableContentFromGameContent(offeredTrade);

      const noteId = await this.activityPubService.createNoteObject(
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

      const { creatorId, requestedResources, offeredResources } =
        tradeOfferToRemove;

      if (acceptantId === creatorId) {
        throw new Error('Cannot accept your own trade offer.');
      }

      if (acceptantId) {
        const wasAbleToPay = await this.resourceService.takeAmountsOfResources(
          requestedResources,
          acceptantId,
          transaction,
        );
        if (!wasAbleToPay) {
          throw new Error('Missing resources to complete the trade.');
        }

        await this.resourceService.addAmountsOfResources(
          offeredResources,
          acceptantId,
          transaction,
        );

        // Share completion of the trade
        await this.activityPubService.likeNoteObject(
          tradeOfferToRemove.activityPubNoteId,
        );
      }

      // If the trade was created by a user on this instance, give them their gained resources
      if (creatorId !== null) {
        await this.resourceService.addAmountsOfResources(
          requestedResources,
          creatorId,
          transaction,
        );

        // Share that the trade is not available anymore
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
}
