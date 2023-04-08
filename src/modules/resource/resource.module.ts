import { Module } from '@nestjs/common';
import { ResourceService } from '@/modules/resource/resource.service';

@Module({
  imports: [],
  controllers: [],
  providers: [ResourceService],
})
export class ResourceModule {}
