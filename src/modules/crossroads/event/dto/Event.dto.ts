import { IdDto } from '@/dto/Id.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsObject,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { EventPayload, EventType } from '../types';

export class EventDto extends IdDto {
  /**
   * The exact date and time this event was created on.
   */
  @IsDate()
    createdOn: Date;

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
   * // TODO when connecting other instances, send them the ID you save them as (or receive one from them), and this is then their "token" to send events to you as well as their identification within this instance.
   *  */
  @IsUUID(4)
    sourceInstanceId: string;
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
