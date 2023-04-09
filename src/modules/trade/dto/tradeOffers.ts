import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { TradeOffer } from './tradeOffer';
import { ApiProperty } from '@nestjs/swagger';

export class TradeOffers {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TradeOffer)
  @ApiProperty({
    // Seems like auto detection of array types is not working for swagger
    isArray: true,
    type: TradeOffer,
  })
    availableOffers: Array<TradeOffer>;
}
