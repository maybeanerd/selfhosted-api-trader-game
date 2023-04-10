import { IsEnum, IsNumber, Min } from 'class-validator';
import { Resource } from '../types';

export class ResourceStatistic {
  @IsNumber()
  @Min(0)
    amount: number;

  @IsNumber()
  @Min(0)
    accumulationPerTick: number;

  @IsEnum(Resource)
    type: Resource;
}
