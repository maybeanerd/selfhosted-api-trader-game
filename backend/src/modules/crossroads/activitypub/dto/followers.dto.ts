import type { APActor, APRoot } from 'activitypub-types';
import { IsArray, IsNumber, IsString, Min } from 'class-validator';

export class FollowerDto {
  @IsString()
    '@context': 'https://www.w3.org/ns/activitystreams';

  @IsString()
    'id': string;

  @IsString()
    'summary': string;

  @IsString()
    'type': 'OrderedCollection';

  @IsNumber()
  @Min(0)
    'totalItems': number;

  @IsArray()
    'orderedItems': Array<Partial<APRoot<APActor>>>;
}
