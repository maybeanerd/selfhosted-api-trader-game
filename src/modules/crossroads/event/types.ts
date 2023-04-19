import { ResourceType } from '@/modules/resource/types';

export enum EventType {
  TradeOfferCreated = 'TradeOfferCreated',
  TradeOfferAccepted = 'TradeOfferAccepted',
  TradeOfferRemoved = 'TradeOfferRemoved',
}

export type TradeOfferCreatedEventPayload = {
  id: string;
  creatorId: string;
  offeredResources: Array<{ type: ResourceType; amount: number }>;
  requestedResources: Array<{ type: ResourceType; amount: number }>;
};
export type TradeOfferCreatedEvent = {
  type: EventType.TradeOfferCreated;
  payload: TradeOfferCreatedEventPayload;
};

export type TradeOfferAcceptedEventPayload = { id: string };
export type TradeOfferAcceptedEvent = {
  type: EventType.TradeOfferAccepted;
  payload: TradeOfferAcceptedEventPayload;
};

export type TradeOfferRemovedEventPayload = {
  id: string;
};
export type TradeOfferRemovedEvent = {
  type: EventType.TradeOfferRemoved;
  payload: TradeOfferRemovedEventPayload;
};

export type Event = {
  id: string;
} & (TradeOfferCreatedEvent | TradeOfferAcceptedEvent | TradeOfferRemovedEvent);

export type EventPayload = Event['payload'];
