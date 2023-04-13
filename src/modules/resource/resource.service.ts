import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ResourceType } from './types';
import { ResourceStatisticDto } from './dto/ResourceStatistic.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Resource, ResourceDocument } from './schemas/Resource.schema';
import { Model } from 'mongoose';

function mapResourceDocumentToResourceStatisticDto(
  resourceDocument: ResourceDocument,
): ResourceStatisticDto {
  const resource = resourceDocument.toObject();
  return {
    type: resource.type,
    amount: resource.amount,
    accumulationPerTick: resource.accumulationPerTick,
  };
}

@Injectable()
export class ResourceService {
  constructor(
    @InjectModel(Resource.name)
    private resourceModel: Model<Resource>,
  ) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async handleCron() {
    console.log('Cron is running...');

    const resources = await this.getStatisticOfAllResources();
    // TODO this could probably be a dedicated function that uses mongoose directly, to limit the amount of requests we send
    await Promise.all(
      resources.map((resource) =>
        this.addAmountOfResource(resource.type, resource.accumulationPerTick),
      ),
    );

    const stone = await this.getStatisticOfResource(ResourceType.STONE);

    const wood = await this.getStatisticOfResource(ResourceType.WOOD);

    console.log({ amountOfStone: stone.amount, amountOfWood: wood.amount });
  }

  async getStatisticOfAllResources(): Promise<Array<ResourceStatisticDto>> {
    const resources = await this.resourceModel.find();

    return resources.map(mapResourceDocumentToResourceStatisticDto);
  }

  async getStatisticOfResource(
    type: ResourceType,
  ): Promise<ResourceStatisticDto> {
    const resource = await this.resourceModel.findOne({ type });
    if (resource === null) {
      return {
        type,
        amount: 0,
        accumulationPerTick: 0,
      };
    }
    return mapResourceDocumentToResourceStatisticDto(resource);
  }

  async addAmountOfResource(
    type: ResourceType,
    amount: number,
  ): Promise<number> {
    const incrementedEntry = await this.resourceModel.findOneAndUpdate(
      { type },
      { $inc: { amount } },
    );
    if (incrementedEntry === null) {
      const createdEntry = await this.resourceModel.create({
        type,
        amount,
        accumulationPerTick: 2,
      });
      return createdEntry.amount;
    }
    return incrementedEntry.amount;
  }

  async takeAmountOfResource(
    type: ResourceType,
    amount: number,
  ): Promise<number> {
    const decrementedEntry = await this.resourceModel.findOneAndUpdate(
      {
        type,
        amount: {
          $gte: amount,
        },
      },
      { $inc: { amount: -amount } },
    );
    if (decrementedEntry === null) {
      return 0;
    }
    return amount;
  }
}
