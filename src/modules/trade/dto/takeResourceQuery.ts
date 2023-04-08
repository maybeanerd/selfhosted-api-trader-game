import { Resource } from '@/modules/resource/types';
import { IsEnum, IsNumber, Min } from 'class-validator';

export class TakeResourceQuery {
  @IsNumber()
  @Min(1)
    amount: number;

  @IsEnum(Resource)
    type: Resource;
}
