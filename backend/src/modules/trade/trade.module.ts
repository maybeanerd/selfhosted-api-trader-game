import { Module } from '@nestjs/common';
import { TradeController } from '@/modules/trade/trade.controller';
import { ResourceModule } from '@/modules/resource/resource.module';
import { TradeService } from '@/modules/trade/trade.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Trade, TradeSchema } from './schemas/Trade.schema';

@Module({
  imports: [
    ResourceModule,
    MongooseModule.forFeature([{ name: Trade.name, schema: TradeSchema }]),
  ],
  controllers: [TradeController],
  providers: [TradeService],
  exports: [TradeService],

})
export class TradeModule {}
