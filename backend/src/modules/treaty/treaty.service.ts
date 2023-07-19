import { Injectable } from '@nestjs/common';
import { StoredTreaty, TreatyStatus } from './schemas/Treaty.schema';
import { ServerState } from './schemas/ServerState.schema';
import { ProposeTreatyDto, TreatyDto } from './dto/Treaty.dto';
import { HttpService } from '@nestjs/axios';
import { crossroadsTreatyPath } from '@/config/apiPaths';
import { InjectModel } from '@nestjs/sequelize';

function mapTreatyDocumentToTreatyDto(treaty: StoredTreaty): TreatyDto {
  return {
    instanceId: treaty.instanceId,
    url: treaty.instanceBaseUrl,
    status: treaty.status,
  };
}

@Injectable()
export class TreatyService {
  constructor(
    @InjectModel(ServerState)
    private serverStateModel: typeof ServerState,
    @InjectModel(StoredTreaty)
    private treatyModel: typeof StoredTreaty,
    private readonly httpService: HttpService,
  ) {
    this.ensureServerId();
  }

  async ensureServerId() {
    const serverState = await this.serverStateModel.findOne();
    if (serverState !== null) {
      return serverState;
    }
    const newlyCreatedTreatyBasis = this.serverStateModel.create({});
    return newlyCreatedTreatyBasis;
  }

  async getAllTreaties(): Promise<Array<TreatyDto>> {
    const treaties = await this.treatyModel.findAll();

    return treaties.map(mapTreatyDocumentToTreatyDto);
  }

  async hasActiveTreaty(instanceId: string): Promise<boolean> {
    const treaty = await this.treatyModel.findOne({ where: { instanceId } });

    return treaty !== null && treaty.status === TreatyStatus.Signed;
  }

  async createTreaty(
    sourceInstanceId: string,
    instanceBaseUrl: string,
  ): Promise<TreatyDto> {
    const serverState = await this.ensureServerId();
    const createdTreaty = await this.treatyModel.create({
      instanceId: sourceInstanceId,
      instanceBaseUrl: instanceBaseUrl,
      status: TreatyStatus.Requested,
    });

    return {
      instanceId: serverState.instanceId,
      url: createdTreaty.instanceBaseUrl,
      status: createdTreaty.status,
    };
  }

  async offerTreaty(instanceBaseUrl: string): Promise<TreatyDto | null> {
    const serverState = await this.ensureServerId();

    const body: ProposeTreatyDto = {
      url: 'http://test.com', // TODO get own URL
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
