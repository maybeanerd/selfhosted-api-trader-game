import { Module } from '@nestjs/common';
import { ResourceService } from '@/modules/resource/resource.service';
import { ResourceController } from '@/modules/resource/resource.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Resource } from '@/modules/resource/schemas/Resource.schema';

@Module({
  imports: [SequelizeModule.forFeature([Resource])],
  controllers: [ResourceController],
  providers: [ResourceService],
  exports: [ResourceService],
})
export class ResourceModule {}
