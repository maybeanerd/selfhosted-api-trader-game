import { IsEnum, IsNumber, Min } from 'class-validator';
import { Resource } from '../types';

export class ResourceWithAmount {
  @IsNumber()
  @Min(0)
    amount: number;

  @IsEnum(Resource)
    type: Resource;
}
