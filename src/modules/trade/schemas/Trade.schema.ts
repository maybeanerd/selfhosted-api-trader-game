import { ResourceType } from '@/modules/resource/types';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';
import { HydratedDocument } from 'mongoose';

@Schema()
class ResourceWithAmount {
  @Prop({ required: true })
    amount: number;

  @Prop({ required: true, type: String, enum: ResourceType })
    type: ResourceType;
}
const ResourceWithAmountSchema =
  SchemaFactory.createForClass(ResourceWithAmount);

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

  @Prop({ required: true, type: [ResourceWithAmountSchema], _id: false })
    offeredResources: Array<ResourceWithAmount>;

  @Prop({ required: true, type: [ResourceWithAmountSchema], _id: false })
    requestedResources: Array<ResourceWithAmount>;
}

export type TradeDocument = HydratedDocument<Trade>;
export const TradeSchema = SchemaFactory.createForClass(Trade);
