import { TreatyStatus } from '@/modules/treaty/types/treatyStatus';
import { IsEnum, IsOptional, IsUUID, IsUrl } from 'class-validator';

export class TreatyOfferDto {
  /**
   * The URL this instance can be reached at.
   */
  @IsUrl({ require_protocol: true })
    url: string;
}

export class ProposeTreatyDto {
  /**
   * The Id of the instance that wants to sign a treaty.
   */
  @IsUUID(4)
    instanceId: string;

  /**
   * The URL this instance can be reached at.
   */
  @IsUrl({ require_protocol: true })
    activityPubActorId: string;
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

  /** The status of the treaty. */
  @IsOptional()
  @IsEnum(TreatyStatus)
    status?: TreatyStatus;
}
