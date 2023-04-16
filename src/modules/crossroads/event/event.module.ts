import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { StoredEvent, StoredEventSchema } from './schemas/Event.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: StoredEvent.name, schema: StoredEventSchema }]),
  ],
  controllers: [EventController],
  providers: [EventService],
})
export class EventModule {}
