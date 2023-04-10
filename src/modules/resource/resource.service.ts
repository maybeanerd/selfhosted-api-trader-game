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

    const amountOfStone = await this.getAmountOfResource(ResourceType.STONE);
    availableResources.set(ResourceType.STONE, amountOfStone + 3);

    const amountOfWood = await this.getAmountOfResource(ResourceType.WOOD);
    availableResources.set(ResourceType.WOOD, amountOfWood + 5);

    console.log({ amountOfStone, amountOfWood });
  }

  async getAmountOfResource(type: ResourceType): Promise<number> {
    const resource = await this.resourceModel.findOne({ type });
    return resource?.amount ?? 0;
  }

  getAmountOfAllResources() {
    return Array.from(availableResources).map(([type, amount]) => ({
      type,
      amount,
    }));
  }

  getStatisticOfAllResources(): Array<ResourceStatisticDto> {
    const amounts = this.getAmountOfAllResources();
    const statistics = amounts.map(({ type, amount }) => ({
      type,
      amount,
      accumulationPerTick: 0,
    }));
    return statistics;
  }

  async getStatisticOfResource(
    type: ResourceType,
  ): Promise<ResourceStatisticDto> {
    const amount = await this.getAmountOfResource(type);
    return { amount, type, accumulationPerTick: 0 };
  }

  takeAmountOfResource(type: ResourceType, amount: number): number {
    const currentAmount = availableResources.get(type) ?? 0;
    if (amount > currentAmount) {
      return 0;
    }
    availableResources.set(type, currentAmount - amount);
    return amount;
  }

  addAmountOfResource(type: ResourceType, amount: number): number {
    const currentAmount = availableResources.get(type) ?? 0;
    const newAmount = currentAmount + amount;
    availableResources.set(type, newAmount);
    return newAmount;
  }
}
