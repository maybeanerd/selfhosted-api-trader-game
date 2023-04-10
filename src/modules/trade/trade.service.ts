import { Injectable } from '@nestjs/common';
import { ResourceType } from '@/modules/resource/types';
import { ResourceService } from '@/modules/resource/resource.service';

@Injectable()
export class TradeService {
  constructor(private readonly resourceService: ResourceService) {}

  takeResource(type: ResourceType, amount: number) {
    const receivedAmount = this.resourceService.takeAmountOfResource(
      type,
      amount,
    );

    return {
      type: type,
      amount: receivedAmount,
    };
  }

  addResource(type: ResourceType, amount: number) {
    const addedAmount = this.resourceService.addAmountOfResource(type, amount);

    return {
      type: type,
      amount: addedAmount,
    };
  }
}
