import { Module } from '@nestjs/common';
import { ResourceService } from '@/modules/resource/resource.service';
import { ResourceController } from '@/modules/resource/resource.controller';

@Module({
  controllers: [ResourceController],
  providers: [ResourceService],
  exports: [ResourceService],
})
export class ResourceModule {}
