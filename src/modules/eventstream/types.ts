export enum EventType {
  TradeOfferCreated = 'TradeOfferCreated',
}

export type TradeOfferCreatedEventPayload = {
  id: string;
  creatorId: string;
};
export type TradeOfferCreatedEvent = {
  type: EventType.TradeOfferCreated;
} & TradeOfferCreatedEventPayload;

export type Event = TradeOfferCreatedEvent;
