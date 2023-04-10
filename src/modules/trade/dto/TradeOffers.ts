import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { TradeOfferDto } from './TradeOffer';
import { ApiProperty } from '@nestjs/swagger';

export class TradeOffersDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TradeOfferDto)
  @ApiProperty({
    // Seems like auto detection of array types is not working for swagger
    isArray: true,
    type: TradeOfferDto,
  })
    availableOffers: Array<TradeOfferDto>;
}
