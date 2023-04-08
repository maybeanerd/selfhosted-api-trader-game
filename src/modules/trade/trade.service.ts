import { Injectable } from '@nestjs/common';

@Injectable()
export class TradeService {
  getResource(
    givenResourceName: string,
    requestedResource: { name: string; amount: number },
  ) {
    console.log(`Got resource: ${givenResourceName}`);
    return requestedResource;
  }
}
