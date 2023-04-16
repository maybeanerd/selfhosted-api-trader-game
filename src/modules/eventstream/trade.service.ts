import { Injectable } from '@nestjs/common';
import { Event } from './schemas/Event.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class EventService {
  constructor(
    @InjectModel(Event.name)
    private eventModel: Model<Event>,
  ) {}
}
