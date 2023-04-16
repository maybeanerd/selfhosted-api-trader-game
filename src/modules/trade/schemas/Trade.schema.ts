import { ResourceType } from '@/modules/resource/types';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';
import { HydratedDocument } from 'mongoose';

export type TradeDocument = HydratedDocument<Trade>;

@Schema()
class ResourceWithAmount {
  @Prop({ required: true })
    amount: number;

  @Prop({ required: true, type: String, enum: ResourceType })
    type: ResourceType;
}

@Schema()
export class Trade {
  @Prop({
    unique: true,
    default: function generateUUID() {
      return randomUUID();
    },
    index: true,
  })
    id: string;

  @Prop({ required: true, type: Array<ResourceWithAmount> })
    offeredResources: Array<ResourceWithAmount>;

  @Prop({ required: true, type: Array<ResourceWithAmount> })
    requestedResources: Array<ResourceWithAmount>;
}

export const TradeSchema = SchemaFactory.createForClass(Trade);
