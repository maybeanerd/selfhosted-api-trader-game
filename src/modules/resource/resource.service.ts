import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ResourceType } from './types';
import { ResourceStatisticDto } from './dto/ResourceStatistic.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Resource } from './schemas/Resource.schema';
import { Model } from 'mongoose';

const availableResources = new Map<ResourceType, number>(
  Object.values(ResourceType).map((resource) => [resource, 0]),
);

@Injectable()
export class ResourceService {
  constructor(
    @InjectModel(Resource.name)
    private resourceModel: Model<Resource>,
  ) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async handleCron() {
    console.log('Cron is running...');

    const stone = await this.getStatisticOfResource(ResourceType.STONE);
    this.addAmountOfResource(ResourceType.STONE, stone.accumulationPerTick);

    const wood = await this.getStatisticOfResource(ResourceType.WOOD);
    this.addAmountOfResource(ResourceType.WOOD, wood.accumulationPerTick);

    console.log({ amountOfStone: stone.amount, amountOfWood: wood.amount });
  }

  async getStatisticOfAllResources(): Promise<Array<ResourceStatisticDto>> {
    const resources = await this.resourceModel.find();

    return resources.map((resource) => resource.toObject());
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
    return resource.toObject();
  }

  async addAmountOfResource(
    type: ResourceType,
    amount: number,
  ): Promise<number> {
    const incremented = await this.resourceModel.findOneAndUpdate(
      { type },
      { $inc: { amount } },
    );
    if (incremented === null) {
      const createdEntry = await this.resourceModel.create({
        type,
        amount,
        accumulationPerTick: 2,
      });
      return createdEntry.amount;
    }
    return incremented.amount;
  }

  takeAmountOfResource(type: ResourceType, amount: number): number {
    const currentAmount = availableResources.get(type) ?? 0;
    if (amount > currentAmount) {
      return 0;
    }
    availableResources.set(type, currentAmount - amount);
    return amount;
  }
}
