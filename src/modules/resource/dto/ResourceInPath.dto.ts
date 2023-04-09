import { IsEnum } from 'class-validator';
import { Resource } from '../types';

export class ResourceType {
  @IsEnum(Resource)
    type: Resource;
}
