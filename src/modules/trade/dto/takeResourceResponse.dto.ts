import { Resource } from '@/modules/resource/types';
import { IsEnum, IsNumber, Min } from 'class-validator';

export class TakeResourceResponse {
  @IsNumber()
  @Min(0)
    amount: number;

  @IsEnum(Resource)
    type: Resource;
}
