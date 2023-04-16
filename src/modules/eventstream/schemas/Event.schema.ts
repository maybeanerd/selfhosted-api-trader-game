import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';
import { HydratedDocument } from 'mongoose';

@Schema()
export class Event {
  @Prop({
    unique: true,
    default: function generateUUID() {
      return randomUUID();
    },
    index: true,
  })
    id: string;

  @Prop({
    required: true,
    index: true,
  })
    creatorId: string;

  /**
   * The Id of a connected remote instance if the trade comes from a remote one.
   */
  @Prop({
    required: false,
    index: true,
  })
    remoteInstanceId?: string;
}

export type EventDocument = HydratedDocument<Event>;
export const EventSchema = SchemaFactory.createForClass(Event);
