import { IsEnum, IsOptional, IsUUID, IsUrl } from 'class-validator';
import { TreatyStatus } from '../schemas/Treaty.schema';

export class ProposeTreatyDto {
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

export class TreatyDto extends ProposeTreatyDto {
  /** The status of the treaty. */
  @IsEnum(TreatyStatus)
    status: TreatyStatus;
}
export class UpdateTreatyDto {
  /**
   * The Id of the instance that wants to sign a treaty.
   */
  @IsUUID(4)
    instanceId: string;

  /**
   * The URL this instance can be reached at.
   */
  @IsOptional()
  @IsUrl()
    url: string;

  /** The status of the treaty. */
  @IsOptional()
  @IsEnum(TreatyStatus)
    status: TreatyStatus;
}
