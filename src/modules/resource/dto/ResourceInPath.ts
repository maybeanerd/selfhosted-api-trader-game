import { IsEnum } from 'class-validator';
import { Resource } from '../types';

export class ResourceInPath {
  @IsEnum(Resource)
    type: Resource;
}
