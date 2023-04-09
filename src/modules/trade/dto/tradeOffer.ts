import { Id } from '@/dto/id.dto';
import { ResourceWithAmount } from '@/modules/resource/dto/ResourceWithAmount.dto';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';

export class TradeOffer extends Id {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResourceWithAmount)
    requestedResources: ResourceWithAmount[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResourceWithAmount)
    offeredResources: ResourceWithAmount[];
}
