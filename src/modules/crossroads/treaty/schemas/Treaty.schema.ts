import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum TreatyStatus {
  Requested = 'requested',
  Denied = 'denied',
  Signed = 'signed',
}

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
   * The date this treaty was created on.
   */
  @Prop({
    required: true,
    default: function generateDate() {
      return new Date();
    },
  })
    createdOn: Date;

  /** The state of the treaty. A treaty is a request at first, and then either gets accepted or denied by the other instance. */
  @Prop({
    required: true,
    type: String,
    enum: TreatyStatus,
    index: true,
  })
    status: TreatyStatus;
}

export type StoredTreatyDocument = HydratedDocument<StoredTreaty>;
export const StoredTreatySchema = SchemaFactory.createForClass(StoredTreaty);
