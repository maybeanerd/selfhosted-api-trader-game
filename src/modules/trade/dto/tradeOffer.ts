import { Id } from '@/dto/id.dto';
import { ResourceWithAmount } from '@/modules/resource/dto/ResourceWithAmount.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';

export class TradeOffer extends Id {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResourceWithAmount)
  @ApiProperty({
    // Seems like auto detection of array types is not working for swagger
    isArray: true,
    type: ResourceWithAmount,
  })
    requestedResources: Array<ResourceWithAmount>;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResourceWithAmount)
  @ApiProperty({
    // Seems like auto detection of array types is not working for swagger
    isArray: true,
    type: ResourceWithAmount,
  })
    offeredResources: Array<ResourceWithAmount>;
}
