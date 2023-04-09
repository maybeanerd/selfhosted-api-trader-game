import { IsUUID } from 'class-validator';

export class Id {
  @IsUUID(4)
    id: string;
}
