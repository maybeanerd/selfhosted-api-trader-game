import { IsEnum } from 'class-validator';
import { Occupation } from '../types';

export class OccupationTypeDto {
  @IsEnum(Occupation)
    occupation: Occupation;
}
