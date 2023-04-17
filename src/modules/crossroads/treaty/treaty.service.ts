import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { StoredTreaty } from './schemas/Treaty.schema';
import { ServerState } from './schemas/ServerState.schema';
import { SignTreatyDto } from './dto/Treaty.dto';

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

  async signTreaty(
    sourceInstanceId: string,
    instanceBaseUrl: string,
  ): Promise<SignTreatyDto> {
    const treatyBasis = await this.ensureServerId();

    await this.treatyModel.create({
      sourceInstanceId,
      instanceBaseUrl,
    });

    return {
      instanceId: treatyBasis.instanceId,
      url: 'TODO', // TODO this instances URL
    };
  }

  async updateTreaty(
    sourceInstanceId: string,
    instanceBaseUrl: string,
  ): Promise<SignTreatyDto | null> {
    const treatyBasis = await this.ensureServerId();

    const existingTreaty = await this.treatyModel
      .findOne({ instanceId: sourceInstanceId })
      .exec();

    if (existingTreaty === null) {
      return null;
    }

    existingTreaty.instanceBaseUrl = instanceBaseUrl;
    await existingTreaty.save();

    return {
      instanceId: treatyBasis.instanceId,
      url: 'TODO', // TODO this instances URL
    };
  }

  // TODO remove treaty
}
