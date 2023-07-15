import { IsEnum, IsNumber, IsUUID, Min } from 'class-validator';
import { ResourceType } from '../types';

export class ResourceStatisticDto {
  @IsUUID(4)
    ownerId: string;

  @IsNumber()
  @Min(0)
    amount: number;

  @IsNumber()
  @Min(0)
    upgradeLevel: number;

  @IsEnum(ResourceType)
    type: ResourceType;
}
