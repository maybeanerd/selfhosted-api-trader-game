import { IsEnum, IsNumber, Min } from 'class-validator';
import { ResourceType } from '../types';

export class ResourceStatisticDto {
  @IsNumber()
  @Min(0)
    amount: number;

  @IsNumber()
  @Min(0)
    accumulationPerTick: number;

  @IsEnum(ResourceType)
    type: ResourceType;
}
