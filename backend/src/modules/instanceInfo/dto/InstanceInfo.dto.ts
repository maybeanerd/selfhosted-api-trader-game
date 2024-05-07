import { IsUrl } from 'class-validator';

export class InstanceInfoDto {
  domain: string;

  title: string;

  version: string;

  @IsUrl()
    sourceUrl: string;

  description: string;
}
