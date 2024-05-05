import { TreatyStatus } from '@/modules/treaty/types/treatyStatus';
import { IsEnum, IsOptional, IsUrl } from 'class-validator';

export class TreatyOfferDto {
  /**
   * The URL this instance can be reached at.
   */
  @IsUrl({ require_protocol: true })
    url: string;
}

export class ProposeTreatyDto {
  /**
   * The id of the actor that this treaty is proposed to.
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
   * The id of the actor that this treaty is related to.
   */
  @IsUrl({ require_protocol: true })
    activityPubActorId: string;

  /** The status of the treaty. */
  @IsOptional()
  @IsEnum(TreatyStatus)
    status?: TreatyStatus;
}
