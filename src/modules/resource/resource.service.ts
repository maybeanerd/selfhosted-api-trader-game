import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Resource } from './types';
import { ResourceStatistic } from './dto/ResourceStatistic.dto';

const availableResources = new Map<Resource, number>(
  Object.values(Resource).map((resource) => [resource, 0]),
);

@Injectable()
export class ResourceService {
  @Cron(CronExpression.EVERY_5_SECONDS)
  handleCron() {
    const amountOfStone = this.getAmountOfResource(Resource.STONE);
    availableResources.set(Resource.STONE, amountOfStone + 3);

    const amountOfWood = this.getAmountOfResource(Resource.WOOD);
    availableResources.set(Resource.WOOD, amountOfWood + 5);
  }

  getAmountOfResource(type: Resource): number {
    return availableResources.get(type) ?? 0;
  }

  getAmountOfAllResources() {
    return Array.from(availableResources).map(([type, amount]) => ({
      type,
      amount,
    }));
  }

  getStatisticOfAllResources(): Array<ResourceStatistic> {
    const amounts = this.getAmountOfAllResources();
    const statistics = amounts.map(({ type, amount }) => ({
      type,
      amount,
      accumulationPerTick: 0,
    }));
    return statistics;
  }

  getStatisticOfResource(type: Resource): ResourceStatistic {
    const amount = this.getAmountOfResource(type);
    return { amount, type, accumulationPerTick: 0 };
  }

  takeAmountOfResource(type: Resource, amount: number): number {
    const currentAmount = availableResources.get(type) ?? 0;
    if (amount > currentAmount) {
      return 0;
    }
    availableResources.set(type, currentAmount - amount);
    return amount;
  }

  addAmountOfResource(type: Resource, amount: number): number {
    const currentAmount = availableResources.get(type) ?? 0;
    const newAmount = currentAmount + amount;
    availableResources.set(type, newAmount);
    return newAmount;
  }
}
