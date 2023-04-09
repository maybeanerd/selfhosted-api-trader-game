import { IsNumber, Min } from 'class-validator';

export class ResourceStatistic {
  @IsNumber()
  @Min(0)
    amount: number;

  @IsNumber()
  @Min(0)
    accumulationPerTick: number;
}
