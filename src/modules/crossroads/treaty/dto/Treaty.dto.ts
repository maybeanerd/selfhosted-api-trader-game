import { IsUUID, IsUrl } from 'class-validator';

export class SignTreatyDto {
  /**
   * The Id of the instance that wants to sign a treaty.
   */
  @IsUUID(4)
    instanceId: string;

  /**
   * The URL this instance can be reached at.
   */
  @IsUrl()
    url: string;
}
