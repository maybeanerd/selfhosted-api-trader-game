import { TradeOffer } from './tradeOffer';
import { OmitType } from '@nestjs/swagger';

export class TradeOfferInput extends OmitType(TradeOffer, ['id']) {}
