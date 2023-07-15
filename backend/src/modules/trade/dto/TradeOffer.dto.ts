import { IdDto } from '@/dto/Id.dto';
import { ResourceWithAmountDto } from '@/modules/resource/dto/ResourceWithAmount.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsUUID, ValidateNested } from 'class-validator';

export class TradeOfferDto extends IdDto {
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ResourceWithAmountDto)
  @ApiProperty({
    // Seems like auto detection of array types is not working for swagger
    isArray: true,
    type: ResourceWithAmountDto,
  })
    requestedResources: Array<ResourceWithAmountDto>;

  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ResourceWithAmountDto)
  @ApiProperty({
    // Seems like auto detection of array types is not working for swagger
    isArray: true,
    type: ResourceWithAmountDto,
  })
    offeredResources: Array<ResourceWithAmountDto>;

  /**
   * If the trade comes from this local instance or from a remote one.
   */
  isLocal: boolean;

  /**
   * The id of the user who created the trade.
   */
  @IsUUID(4)
    creatorId: string;
}
