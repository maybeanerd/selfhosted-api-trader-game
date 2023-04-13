import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ResourceType } from '../types';

export type ResourceDocument = HydratedDocument<Resource>;

@Schema()
export class Resource {
  @Prop({ required: true })
    amount: number;

  @Prop({ required: true })
    accumulationPerTick: number;

  @Prop({ required: true, type: String, enum: ResourceType, index: true })
    type: ResourceType;
}

export const ResourceSchema = SchemaFactory.createForClass(Resource);
