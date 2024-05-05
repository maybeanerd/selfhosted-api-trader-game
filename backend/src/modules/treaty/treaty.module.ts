import { Module } from '@nestjs/common';
import { TreatyController } from './treaty.controller';
import { TreatyService } from './treaty.service';
import { CrossroadsModule } from '@/modules/crossroads/crossroads.module';

@Module({
  imports: [CrossroadsModule],
  controllers: [TreatyController],
  providers: [TreatyService],
  exports: [TreatyService],
})
export class TreatyModule {}
