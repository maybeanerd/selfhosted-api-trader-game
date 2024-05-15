import type { APActivity, APRoot } from 'activitypub-types';
import { IsArray, IsNumber, IsString, Min } from 'class-validator';

export class OutboxDto {
  @IsString()
    '@context': 'https://www.w3.org/ns/activitystreams';

  @IsString()
    'summary': string;

  @IsString()
    'type': 'OrderedCollection';

  @IsNumber()
  @Min(0)
    'totalItems': number;

  @IsArray()
    'orderedItems': Array<APRoot<APActivity>>;
}
