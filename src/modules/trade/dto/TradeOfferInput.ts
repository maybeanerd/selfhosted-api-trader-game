import { TradeOffer } from './TradeOffer';
import { OmitType } from '@nestjs/swagger';

export class TradeOfferInput extends OmitType(TradeOffer, ['id']) {}
