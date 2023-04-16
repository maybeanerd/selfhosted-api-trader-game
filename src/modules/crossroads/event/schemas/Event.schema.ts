import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';
import { HydratedDocument } from 'mongoose';
import { EventPayload, EventType } from '../types';

@Schema()
export class StoredEvent {
  @Prop({
    unique: true,
    default: function generateUUID() {
      return randomUUID();
    },
    index: true,
  })
    id: string;

  /**
   * The creation date of the event.
   */
  @Prop({
    required: true,
    index: true,
  })
    createdOn: Date;

  /**
   * The date this instance first received this event.
   *
   * Maybe in the future this can be used to determine lag between instances or similar things.
   *
   */
  @Prop({
    required: true,
    index: true,
    default: function generateDate() {
      return new Date();
    },
  })
    receivedOn: Date;

  @Prop({ required: true, type: String, enum: EventType, index: true })
    type: EventType;

  @Prop({ required: true, type: Object })
    payload: EventPayload;

  /**
   * The Id of a connected remote instance if the trade comes from a remote one.
   */
  @Prop({
    required: false,
    index: true,
  })
    remoteInstanceId?: string;
}

export type StoredEventDocument = HydratedDocument<StoredEvent>;
export const StoredEventSchema = SchemaFactory.createForClass(StoredEvent);
