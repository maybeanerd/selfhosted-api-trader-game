import { TradeOfferDto } from './TradeOffer';
import { OmitType } from '@nestjs/swagger';

export class TradeOfferInputDto extends OmitType(TradeOfferDto, ['id']) {}
