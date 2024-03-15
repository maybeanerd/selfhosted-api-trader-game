import { Injectable } from '@nestjs/common';
import { StoredTreaty, serverState } from 'db/schema';
import { ProposeTreatyDto, TreatyDto } from './dto/Treaty.dto';
import { HttpService } from '@nestjs/axios';
import { crossroadsTreatyPath } from '@/config/apiPaths';
import { drizz } from 'db';
import { TreatyStatus } from '@/modules/treaty/types/treatyStatus';

function mapTreatyDocumentToTreatyDto(treaty: StoredTreaty): TreatyDto {
  return {
    instanceId: treaty.instanceId,
    url: treaty.instanceBaseUrl,
    status: treaty.status,
  };
}

@Injectable()
export class TreatyService {
  constructor(private readonly httpService: HttpService) {
    this.ensureServerId();
  }

  async ensureServerId(): Promise<string> {
    return drizz.transaction(async (transaction) => {
      const existingState = await transaction.query.serverState.findFirst();
      if (existingState !== undefined) {
        return existingState.instanceId;
      }

      const newlyCreatedServerStates = await transaction
        .insert(serverState)
        .values({})
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
      where: (t, { eq }) => eq(t.instanceId, instanceId),
    });

    return treaty !== undefined && treaty.status === TreatyStatus.Signed;
  }

  async createTreaty(
    sourceInstanceId: string,
    instanceBaseUrl: string,
  ): Promise<TreatyDto> {
    const serverId = await this.ensureServerId();
    const createdTreaty = await this.treatyModel.create({
      instanceId: sourceInstanceId,
      instanceBaseUrl: instanceBaseUrl,
      status: TreatyStatus.Requested,
    });

    return {
      instanceId: serverId,
      url: createdTreaty.instanceBaseUrl,
      status: createdTreaty.status,
    };
  }

  ownURL = 'http://7.22.217.133:8080'; // TODO get own URL

  async offerTreaty(instanceBaseUrl: string): Promise<TreatyDto | null> {
    const serverState = await this.ensureServerId();

    const body: ProposeTreatyDto = {
      url: this.ownURL,
      instanceId: serverState.instanceId,
    };

    const url = instanceBaseUrl + crossroadsTreatyPath;
    let offeredTreaty: TreatyDto | undefined;
    try {
      offeredTreaty = (
        await this.httpService.post<TreatyDto>(url, body).toPromise()
      )?.data;
    } catch {
      return null;
    }

    if (offeredTreaty === undefined) {
      return null;
    }

    const createdTreaty = await this.treatyModel.create({
      instanceId: offeredTreaty.instanceId,
      instanceBaseUrl: instanceBaseUrl,
      status: offeredTreaty.status,
    });

    return {
      instanceId: createdTreaty.instanceId,
      url: createdTreaty.instanceBaseUrl,
      status: createdTreaty.status,
    };
  }

  async updateTreaty(
    sourceInstanceId: string,
    update: { url?: string; status?: TreatyStatus },
  ): Promise<TreatyDto | null> {
    const serverState = await this.ensureServerId();

    const existingTreaty = await this.treatyModel.findOne({
      where: { instanceId: sourceInstanceId },
    });

    if (existingTreaty === null) {
      return null;
    }

    if (update.url) {
      existingTreaty.instanceBaseUrl = update.url;
    }
    if (update.status) {
      existingTreaty.status = update.status;
    }

    const url = existingTreaty.instanceBaseUrl + crossroadsTreatyPath;
    const body: TreatyDto = {
      status: existingTreaty.status,
      url: this.ownURL,
      instanceId: serverState.instanceId,
    };
    try {
      await this.httpService.put<TreatyDto>(url, body).toPromise();
    } catch {
      return null;
    }

    await existingTreaty.save();

    return {
      instanceId: serverState.instanceId,
      url: existingTreaty.instanceBaseUrl,
      status: existingTreaty.status,
    };
  }

  async removeTreaty(sourceInstanceId: string): Promise<boolean> {
    const removedTreaties = await this.treatyModel.destroy({
      where: { instanceId: sourceInstanceId },
    });

    return removedTreaties > 0;
  }
}
