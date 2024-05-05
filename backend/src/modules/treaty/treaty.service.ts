import { Injectable } from '@nestjs/common';
import {
  ActivityPubActivity,
  StoredTreaty,
  serverState,
  storedTreaty,
} from 'db/schema';
import { TreatyDto } from './dto/Treaty.dto';
import { drizz } from 'db';
import { TreatyStatus } from '@/modules/treaty/types/treatyStatus';
import { eq } from 'drizzle-orm';
import { generateKeys } from '@/modules/crossroads/activitypub/utils/signing';
import { ActivityPubService } from '@/modules/crossroads/activitypub/activityPub.service';
import {
  HandlerActivityType,
  addActivityGameLogicHandler,
} from '@/modules/crossroads/activitypub/utils/incomingActivityHandler';

function mapTreatyDocumentToTreatyDto(treaty: StoredTreaty): TreatyDto {
  return {
    activityPubActorId: treaty.activityPubActorId,
    status: treaty.status,
  };
}

@Injectable()
export class TreatyService {
  constructor(private readonly activityPubService: ActivityPubService) {
    this.ensureServerId();

    addActivityGameLogicHandler(
      HandlerActivityType.Follow,
      this.handleFollowActivity.bind(this),
    );

    addActivityGameLogicHandler(
      HandlerActivityType.Unfollow,
      this.handleUnFollowActivity.bind(this),
    );
  }

  async handleFollowActivity(activity: ActivityPubActivity) {
    const existingTreaty = await drizz.query.storedTreaty.findFirst({
      where: eq(storedTreaty.activityPubActorId, activity.actor),
    });

    if (existingTreaty === undefined) {
      await this.createTreaty(activity.actor, TreatyStatus.Proposed);
      return;
    }

    if (
      existingTreaty.status === TreatyStatus.Requested ||
      existingTreaty.status === TreatyStatus.Rejected
    ) {
      await this.updateTreaty(activity.actor, {
        status: TreatyStatus.Signed,
      });
      return;
    }

    console.error(
      'Treaty was already marked a signed, removed, or proposed, but we got their follow activity.',
      existingTreaty,
    );
  }

  async handleUnFollowActivity(activity: ActivityPubActivity) {
    const existingTreaty = await drizz.query.storedTreaty.findFirst({
      where: eq(storedTreaty.activityPubActorId, activity.actor),
    });

    if (existingTreaty === undefined) {
      console.error(
        'Treaty did not exist in the first place, but we received an unfollow.',
        existingTreaty,
      );
      return;
    }

    if (existingTreaty.status === TreatyStatus.Proposed) {
      await drizz
        .delete(storedTreaty)
        .where(eq(storedTreaty.activityPubActorId, activity.actor));
      return;
    }

    if (
      existingTreaty.status === TreatyStatus.Requested ||
      existingTreaty.status === TreatyStatus.Signed
    ) {
      await this.updateTreaty(activity.actor, {
        status: TreatyStatus.Rejected,
      });
      return;
    }

    console.error(
      'Treaty was already marked a rejected, but we just got their unfollow activity.',
      existingTreaty,
    );
  }

  async ensureServerId(): Promise<string> {
    return drizz.transaction(async (transaction) => {
      const existingState = await transaction.query.serverState.findFirst();
      if (existingState !== undefined) {
        return existingState.instanceId;
      }

      const { privateKey, publicKey } = await generateKeys();

      const newlyCreatedServerStates = await transaction
        .insert(serverState)
        .values({
          privateKey,
          publicKey,
        })
        .returning();

      const newlyCreatedServerState = newlyCreatedServerStates.at(0);
      if (newlyCreatedServerState === undefined) {
        throw new Error('Failed creating server state');
      }
      return newlyCreatedServerState.instanceId;
    });
  }

  async getAllTreaties(): Promise<Array<TreatyDto>> {
    // TODO pagination
    const treaties = await drizz.query.storedTreaty.findMany();

    return treaties.map(mapTreatyDocumentToTreatyDto);
  }

  async hasActiveTreaty(activityPubActorId: string): Promise<boolean> {
    const treaty = await drizz.query.storedTreaty.findFirst({
      where: (t) => eq(t.activityPubActorId, activityPubActorId),
    });

    return treaty !== undefined && treaty.status === TreatyStatus.Signed;
  }

  async createTreaty(
    activityPubActorId: string,
    status: TreatyStatus,
  ): Promise<TreatyDto> {
    const createdTreaties = await drizz
      .insert(storedTreaty)
      .values({
        activityPubActorId,
        status,
      })
      .returning();

    const createdTreaty = createdTreaties.at(0);
    if (createdTreaty === undefined) {
      throw new Error('Failed creating treaty');
    }

    return {
      activityPubActorId: createdTreaty.activityPubActorId,
      status: createdTreaty.status,
    };
  }

  async offerTreaty(instanceBaseUrl: string): Promise<TreatyDto | null> {
    const actor =
      await this.activityPubService.importActorFromWebfinger(instanceBaseUrl);

    if (actor === null) {
      return null;
    }

    await this.activityPubService.followActor(actor.id);

    const existingTreaty = await drizz.query.storedTreaty.findFirst({
      where: eq(storedTreaty.activityPubActorId, actor.id),
    });
    // When offering a treaty, if we have a treaty that was removed, we revive it.
    if (existingTreaty?.status === TreatyStatus.Removed) {
      return this.updateTreaty(actor.id, {
        status: TreatyStatus.Signed,
      });
    }

    const createdTreaty = await this.createTreaty(
      actor.id,
      TreatyStatus.Requested,
    );

    return createdTreaty;
  }

  async updateTreaty(
    activityPubActorId: string,
    update: { status?: TreatyStatus },
  ): Promise<TreatyDto | null> {
    return drizz.transaction(async (transaction) => {
      const existingTreaty = await transaction.query.storedTreaty.findFirst({
        where: eq(storedTreaty.activityPubActorId, activityPubActorId),
      });

      if (existingTreaty === undefined) {
        return null;
      }

      if (update.status) {
        existingTreaty.status = update.status;
      }

      await transaction
        .update(storedTreaty)
        .set(existingTreaty)
        .where(eq(storedTreaty.activityPubActorId, activityPubActorId));

      return {
        activityPubActorId: existingTreaty.activityPubActorId,
        status: existingTreaty.status,
      };
    });
  }

  async acceptTreaty(activityPubActorId: string): Promise<TreatyDto | null> {
    await this.activityPubService.followActor(activityPubActorId);

    const updatedTreaty = await this.updateTreaty(activityPubActorId, {
      status: TreatyStatus.Signed,
    });

    return updatedTreaty;
  }

  async removeTreaty(activityPubActorId: string): Promise<boolean> {
    await this.activityPubService.unfollowActor(activityPubActorId);

    const treaty = await drizz.query.storedTreaty.findFirst({
      where: eq(storedTreaty.activityPubActorId, activityPubActorId),
    });

    if (
      treaty?.status === TreatyStatus.Signed ||
      treaty?.status === TreatyStatus.Proposed
    ) {
      /**
       * Instead of deleting the treaty, we mark it as removed.
       * This way we know the other party still offers a treaty
       * and can revive it as an immediately signed treaty.
       */
      await this.updateTreaty(activityPubActorId, {
        status: TreatyStatus.Removed,
      });
      return true;
    }

    await drizz
      .delete(storedTreaty)
      .where(eq(storedTreaty.activityPubActorId, activityPubActorId));

    return true;
  }
}
