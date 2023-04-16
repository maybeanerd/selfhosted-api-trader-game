export enum EventType {
  TradeOfferCreated = 'TradeOfferCreated',
  TradeOfferAccepted = 'TradeOfferAccepted',
  TradeOfferRemoved = 'TradeOfferRemoved',
}

export type TradeOfferCreatedEventPayload = {
  creatorId: string;
};
export type TradeOfferCreatedEvent = {
  type: EventType.TradeOfferCreated;
  payload: TradeOfferCreatedEventPayload;
};

export type TradeOfferAcceptedEventPayload = { dummy: undefined };
export type TradeOfferAcceptedEvent = {
  type: EventType.TradeOfferAccepted;
  payload: TradeOfferAcceptedEventPayload;
};

export type TradeOfferRemovedEventPayload = {
  dummy: undefined;
};
export type TradeOfferRemovedEvent = {
  type: EventType.TradeOfferRemoved;
  payload: TradeOfferRemovedEventPayload;
};

export type Event = {
  id: string;
} & (TradeOfferCreatedEvent | TradeOfferAcceptedEvent | TradeOfferRemovedEvent);

export type EventPayload = Event['payload'];
