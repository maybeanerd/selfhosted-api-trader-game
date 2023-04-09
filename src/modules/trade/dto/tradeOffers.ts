import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { TradeOffer } from './tradeOffer';

export class TradeOffers {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TradeOffer)
    availableOffers: TradeOffer[];
}
