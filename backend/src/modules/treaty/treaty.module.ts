import { Module } from '@nestjs/common';
import { TreatyController } from './treaty.controller';
import { TreatyService } from './treaty.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [TreatyController],
  providers: [TreatyService],
  exports: [TreatyService],
})
export class TreatyModule {}
