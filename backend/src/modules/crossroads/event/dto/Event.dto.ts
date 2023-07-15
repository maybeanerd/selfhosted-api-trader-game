import { IdDto } from '@/dto/Id.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDate,
  IsDateString,
  IsEnum,
  IsObject,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { EventPayload, EventType } from '../types';

export class EventDto extends IdDto {
  /**
   * The exact date and time this event was created on.
   */
  @IsDateString()
    createdOn: string;

  /** The type of event. */
  @IsEnum(EventType)
    type: EventType;

  /** The payload of the event. */
  @IsObject()
    payload: EventPayload;

  /**
   * The Id of the instance that created this event. If the event is from this instance, it will be set dynamically depending on who requests the info/who we send it to.
   */
  @IsUUID(4)
    sourceInstanceId: string;
}

export class EventsDto {
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => EventDto)
  @ApiProperty({
    // Seems like auto detection of array types is not working for swagger
    isArray: true,
    type: EventDto,
  })
    events: Array<EventDto>;
}

export class EventsInputDto extends EventsDto {
  /**
   * The location/Identifier of the source Instance.
   *  */
  @IsUUID(4)
    sourceInstanceId: string;
}

export class GetEventsOfTimeframeDto extends IdDto {
  /**
   * The date from when on these events are.
   *
   * Use this to paginate through events if your are catching up on old ones.
   */
  @IsDateString()
    from: string;

  /**
   * The date until when these events are.
   */
  @IsDateString()
  @IsOptional()
    to?: string;
}

export class EventsOfTimeframeDto extends EventsDto {
  /**
   * The date from when on these events are.
   */
  @IsDate()
    from: Date;

  /**
   * The date until when these events are.
   */
  @IsDate()
    to: Date;
}
