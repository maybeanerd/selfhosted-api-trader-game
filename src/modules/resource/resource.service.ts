import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Resource } from './types';

const availableResources = new Map<Resource, number>(
  Object.values(Resource).map((resource) => [resource, 0]),
);

@Injectable()
export class ResourceService {
  @Cron(CronExpression.EVERY_5_SECONDS)
  handleCron() {
    console.log('Called every 5 seconds');
    console.log(availableResources);

    const amountOfStone = this.getAmountOfResource(Resource.STONE);
    availableResources.set(Resource.STONE, amountOfStone + 3);

    const amountOfWood = this.getAmountOfResource(Resource.WOOD);
    availableResources.set(Resource.WOOD, amountOfWood + 5);
  }

  getAmountOfResource(type: Resource): number {
    return availableResources.get(type) ?? 0;
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
