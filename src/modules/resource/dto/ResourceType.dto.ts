import { IsEnum } from 'class-validator';
import { ResourceType } from '../types';

export class ResourceTypeDto {
  @IsEnum(ResourceType)
    type: ResourceType;
}
