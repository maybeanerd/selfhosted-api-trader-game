import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, ValidateNested } from 'class-validator';
import { TradeOfferDto } from './TradeOffer.dto';
import { ApiProperty } from '@nestjs/swagger';

export class TradeOffersDto {
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => TradeOfferDto)
  @ApiProperty({
    // Seems like auto detection of array types is not working for swagger
    isArray: true,
    type: TradeOfferDto,
  })
    availableOffers: Array<TradeOfferDto>;
}
