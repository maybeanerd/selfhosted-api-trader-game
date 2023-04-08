import { Injectable } from '@nestjs/common';
import { Resource } from '@/modules/resource/types';
import { ResourceService } from '@/modules/resource/resource.service';

@Injectable()
export class TradeService {
  constructor(private readonly resourceService: ResourceService) {}

  takeResource(type: Resource, amount: number) {
    const receivedAmount = this.resourceService.takeAmountOfResource(
      type,
      amount,
    );

    return {
      type: type,
      amount: receivedAmount,
    };
  }
}
