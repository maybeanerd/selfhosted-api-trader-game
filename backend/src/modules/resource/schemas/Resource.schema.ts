import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ResourceType } from '../types';

@Schema()
export class Resource {
  @Prop({
    required: true,
    index: true,
  })
    ownerId: string;

  @Prop({ required: true })
    amount: number;

  @Prop({ required: true })
    upgradeLevel: number;

  @Prop({ required: true, type: String, enum: ResourceType, index: true })
    type: ResourceType;
}

export type ResourceDocument = HydratedDocument<Resource>;
export const ResourceSchema = SchemaFactory.createForClass(Resource);
