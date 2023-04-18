import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TreatyController } from './treaty/crossroads.treaty.controller';
import { TreatyService } from '@/modules/treaty/treaty.service';
import {
  StoredTreaty,
  StoredTreatySchema,
} from '@/modules/treaty/schemas/Treaty.schema';
import {
  ServerState,
  ServerStateSchema,
} from '@/modules/treaty/schemas/ServerState.schema';
import { StoredEvent, StoredEventSchema } from './event/schemas/Event.schema';
import { EventController } from './event/event.controller';
import { EventService } from './event/event.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StoredTreaty.name, schema: StoredTreatySchema },
      { name: ServerState.name, schema: ServerStateSchema },
      { name: StoredEvent.name, schema: StoredEventSchema },
    ]),
    HttpModule,
  ],

  controllers: [TreatyController, EventController],
  providers: [TreatyService, EventService],
})
export class CrossroadsModule {}
