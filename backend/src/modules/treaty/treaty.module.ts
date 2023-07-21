import { Module } from '@nestjs/common';
import { TreatyController } from './treaty.controller';
import { TreatyService } from './treaty.service';
import { HttpModule } from '@nestjs/axios';
import { StoredTreaty } from '@/modules/treaty/schemas/Treaty.schema';
import { ServerState } from '@/modules/treaty/schemas/ServerState.schema';
import { SequelizeModule } from '@nestjs/sequelize';

@Module({
  imports: [
    SequelizeModule.forFeature([StoredTreaty, ServerState]),
    HttpModule,
  ],
  controllers: [TreatyController],
  providers: [TreatyService],
  exports: [TreatyService],
})
export class TreatyModule {}
