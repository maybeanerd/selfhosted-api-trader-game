import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { HelloWorldModule } from '@/modules/helloworld/helloworld.module';

@Module({
  imports: [ScheduleModule.forRoot(), HelloWorldModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
