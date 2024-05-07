import { Module } from '@nestjs/common';
import { InstanceInfoController } from '@/modules/instanceInfo/instanceInfo.controller';

@Module({
  controllers: [InstanceInfoController],
})
export class InstanceInfoModule {}
