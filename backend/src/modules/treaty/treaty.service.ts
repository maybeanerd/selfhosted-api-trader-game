import { Injectable } from '@nestjs/common';
import { StoredTreaty, serverState, storedTreaty } from 'db/schema';
import { TreatyDto } from './dto/Treaty.dto';
import { HttpService } from '@nestjs/axios';
import { crossroadsTreatyPath } from '@/config/apiPaths';
import { drizz } from 'db';
import { TreatyStatus } from '@/modules/treaty/types/treatyStatus';
import { eq } from 'drizzle-orm';
import { generateKeys } from '@/modules/crossroads/activitypub/utils/signing';
import { ActivityPubService } from '@/modules/crossroads/activitypub/activityPub.service';
import { randomUUID } from 'crypto';

function mapTreatyDocumentToTreatyDto(treaty: StoredTreaty): TreatyDto {
  return {
    instanceId: treaty.instanceId,
    activityPubActorId: treaty.activityPubActorId,
    status: treaty.status,
  };
}

@Injectable()
export class TreatyService {
  constructor(
    private readonly httpService: HttpService,
    private readonly activityPubService: ActivityPubService,
  ) {
    this.ensureServerId();
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

  async hasActiveTreaty(instanceId: string): Promise<boolean> {
    const treaty = await drizz.query.storedTreaty.findFirst({
      where: (t) => eq(t.instanceId, instanceId),
    });

    return treaty !== undefined && treaty.status === TreatyStatus.Signed;
  }

  async createTreaty(
    sourceInstanceId: string,
    activityPubActorId: string,
    status = TreatyStatus.Requested,
  ): Promise<TreatyDto> {
    const serverId = await this.ensureServerId();
    const createdTreaties = await drizz
      .insert(storedTreaty)
      .values({
        instanceId: sourceInstanceId,
        activityPubActorId,
        status,
      })
      .returning();

    const createdTreaty = createdTreaties.at(0);
    if (createdTreaty === undefined) {
      throw new Error('Failed creating treaty');
    }

    return {
      instanceId: serverId,
      activityPubActorId: createdTreaty.activityPubActorId,
      status: createdTreaty.status,
    };
  }

  ownURL = 'http://7.22.217.133:8080'; // TODO get own URL

  async offerTreaty(instanceBaseUrl: string): Promise<TreatyDto | null> {
    const actor =
      await this.activityPubService.importActorFromWebfinger(instanceBaseUrl);

    if (actor === null) {
      return null;
    }

    await this.activityPubService.followActor(actor.id);

    const createdTreaty = await this.createTreaty(
      randomUUID(),
      actor.id,
      TreatyStatus.Requested,
    );

    return createdTreaty;
  }

  async updateTreaty(
    sourceInstanceId: string,
    update: { status?: TreatyStatus },
  ): Promise<TreatyDto | null> {
    const serverId = await this.ensureServerId();

    return drizz.transaction(async (transaction) => {
      const existingTreaty = await transaction.query.storedTreaty.findFirst({
        where: eq(storedTreaty.instanceId, sourceInstanceId),
      });

      if (existingTreaty === undefined) {
        return null;
      }

      if (update.status) {
        existingTreaty.status = update.status;
      }

      const url = existingTreaty.activityPubActorId + crossroadsTreatyPath;
      const body: TreatyDto = {
        status: existingTreaty.status,
        activityPubActorId: this.ownURL,
        instanceId: serverId,
      };
      try {
        await this.httpService.put<TreatyDto>(url, body).toPromise();
      } catch {
        return null;
      }

      await transaction
        .update(storedTreaty)
        .set(existingTreaty)
        .where(eq(storedTreaty.instanceId, sourceInstanceId));

      return {
        instanceId: serverId,
        activityPubActorId: existingTreaty.activityPubActorId,
        status: existingTreaty.status,
      };
    });
  }

  async removeTreaty(sourceInstanceId: string): Promise<boolean> {
    // TODO activitypub delete
    const { rowCount: deletedTreaties } = await drizz
      .delete(storedTreaty)
      .where(eq(storedTreaty.instanceId, sourceInstanceId));

    if (deletedTreaties === null) {
      return false;
    }

    const successfullyDeleted = deletedTreaties > 0;
    if (!successfullyDeleted) {
      return false;
    }

    // TODO activitypub unfollow, we need to get the actor id (pobably before deleting it.)
    // await this.activityPubService.unfollowActor(sourceInstanceId);

    return true;
  }
}
