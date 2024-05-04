import { Module } from '@nestjs/common';
import { TradeController } from '@/modules/trade/trade.controller';
import { ResourceModule } from '@/modules/resource/resource.module';
import { TradeService } from '@/modules/trade/trade.service';
import { CrossroadsModule } from '@/modules/crossroads/crossroads.module';

@Module({
  imports: [ResourceModule, CrossroadsModule],
  controllers: [TradeController],
  providers: [TradeService],
  exports: [TradeService],
})
export class TradeModule {}
