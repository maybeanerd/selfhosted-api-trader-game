import { TradeOfferDto } from './TradeOffer.dto';
import { OmitType } from '@nestjs/swagger';

export class TradeOfferInputDto extends OmitType(TradeOfferDto, ['id']) {}
