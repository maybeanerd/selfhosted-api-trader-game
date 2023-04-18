import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TreatyController } from './treaty.controller';
import { TreatyService } from './treaty.service';
import { StoredTreaty, StoredTreatySchema } from './schemas/Treaty.schema';
import { ServerState, ServerStateSchema } from './schemas/ServerState.schema';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StoredTreaty.name, schema: StoredTreatySchema },
      { name: ServerState.name, schema: ServerStateSchema },
    ]),
    HttpModule,
  ],
  controllers: [TreatyController],
  providers: [TreatyService],
})
export class TreatyModule {}
