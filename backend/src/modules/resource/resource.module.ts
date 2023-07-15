import { Module } from '@nestjs/common';
import { ResourceService } from '@/modules/resource/resource.service';
import { ResourceController } from '@/modules/resource/resource.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Resource, ResourceSchema } from './schemas/Resource.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Resource.name, schema: ResourceSchema },
    ]),
  ],
  controllers: [ResourceController],
  providers: [ResourceService],
  exports: [ResourceService],
})
export class ResourceModule {}
