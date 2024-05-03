import { Module } from '@nestjs/common';
import { TreatyController } from './treaty.controller';
import { TreatyService } from './treaty.service';
import { HttpModule } from '@nestjs/axios';
import { CrossroadsModule } from '@/modules/crossroads/crossroads.module';

@Module({
  imports: [HttpModule, CrossroadsModule],
  controllers: [TreatyController],
  providers: [TreatyService],
  exports: [TreatyService],
})
export class TreatyModule {}
