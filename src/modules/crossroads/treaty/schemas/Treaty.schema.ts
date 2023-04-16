import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema()
export class StoredTreaty {
  @Prop({
    required: true,
    unique: true,
    index: true,
  })
    instanceId: string;

  /**
   * The URL this instance can be reached at.
   */
  @Prop({
    required: true,
    unique: true,
    index: true,
  })
    instanceBaseUrl: string;

  /**
   * The date this treaty was signed on.
   */
  @Prop({
    required: true,
    default: function generateDate() {
      return new Date();
    },
  })
    signedOn: Date;
}

export type StoredTreatyDocument = HydratedDocument<StoredTreaty>;
export const StoredTreatySchema = SchemaFactory.createForClass(StoredTreaty);
