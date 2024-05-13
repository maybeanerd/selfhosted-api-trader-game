import { Module } from '@nestjs/common';
import { ResourceService } from '@/modules/resource/resource.service';
import { ResourceController } from '@/modules/resource/resource.controller';
import { OccupationController } from '@/modules/resource/occupation.controller';

@Module({
  controllers: [ResourceController, OccupationController],
  providers: [ResourceService],
  exports: [ResourceService],
})
export class ResourceModule {}
