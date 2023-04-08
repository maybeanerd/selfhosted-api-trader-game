import { Module } from '@nestjs/common';
import { HelloWorldController } from '@/modules/helloworld/helloworld.controller';
import { HelloWorldService } from '@/modules/helloworld/helloworld.service';

@Module({
  imports: [],
  controllers: [HelloWorldController],
  providers: [HelloWorldService],
})
export class HelloWorldModule {}
