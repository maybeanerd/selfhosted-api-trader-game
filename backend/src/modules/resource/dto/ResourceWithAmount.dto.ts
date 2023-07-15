import { IsEnum, IsNumber, Min } from 'class-validator';
import { ResourceType } from '../types';

export class ResourceWithAmountDto {
  @IsNumber()
  @Min(0)
    amount: number;

  @IsEnum(ResourceType)
    type: ResourceType;
}
