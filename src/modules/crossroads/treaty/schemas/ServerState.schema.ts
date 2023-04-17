import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';
import { HydratedDocument } from 'mongoose';

@Schema()
export class ServerState {
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

export type ServerStateDocument = HydratedDocument<ServerState>;
export const ServerStateSchema = SchemaFactory.createForClass(ServerState);
