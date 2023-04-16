import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';
import { HydratedDocument } from 'mongoose';

@Schema()
export class StoredTreatyBasis {
  /**
   * The Id we created for this instance.
   */
  @Prop({
    required: true,
    unique: true,
    default: function generateUUID() {
      return randomUUID();
    },
    index: true,
  })
    instanceId: string;
}

export type StoredTreatyBasisDocument = HydratedDocument<StoredTreatyBasis>;
export const StoredTreatyBasisSchema =
  SchemaFactory.createForClass(StoredTreatyBasis);
