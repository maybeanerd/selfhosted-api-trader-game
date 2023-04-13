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
// Generate a Mongoose Schema before use as Subdocument
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

  @Prop({ required: true, type: Array<ResourceWithAmount> })
    offeredResources: Array<ResourceWithAmount>;

  @Prop({ required: true, type: [ResourceWithAmountSchema] })
    requestedResources: Array<ResourceWithAmount>;
}

export const TradeSchema = SchemaFactory.createForClass(Trade);
