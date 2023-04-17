import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { StoredTreaty, TreatyStatus } from './schemas/Treaty.schema';
import { ServerState } from './schemas/ServerState.schema';
import { TreatyDto } from './dto/Treaty.dto';

@Injectable()
export class TreatyService {
  constructor(
    @InjectModel(StoredTreaty.name)
    private treatyModel: Model<StoredTreaty>,
    @InjectModel(ServerState.name)
    private serverStateModel: Model<ServerState>,
  ) {
    this.ensureServerId();
  }

  async ensureServerId() {
    const treatyBasis = await this.serverStateModel.findOne().exec();
    if (treatyBasis !== null) {
      return treatyBasis;
    }
    const newlyCreatedTreatyBasis = this.serverStateModel.create({});
    return newlyCreatedTreatyBasis;
  }

  async createTreaty(
    sourceInstanceId: string,
    instanceBaseUrl: string,
  ): Promise<TreatyDto> {
    const serverState = await this.ensureServerId();

    const createdTreaty = await this.treatyModel.create({
      sourceInstanceId,
      instanceBaseUrl: instanceBaseUrl,
      status: TreatyStatus.Requested,
    });

    return {
      instanceId: serverState.instanceId,
      url: createdTreaty.instanceBaseUrl,
      status: createdTreaty.status,
    };
  }

  async updateTreaty(
    sourceInstanceId: string,
    update: { url?: string; status?: TreatyStatus },
  ): Promise<TreatyDto | null> {
    const serverState = await this.ensureServerId();

    const existingTreaty = await this.treatyModel
      .findOne({ instanceId: sourceInstanceId })
      .exec();

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
    const removedTreaty = await this.treatyModel
      .deleteOne({ instanceId: sourceInstanceId })
      .exec();

    return removedTreaty.deletedCount > 0;
  }
}
