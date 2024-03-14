// A collection of all the schemas in the application.

import { StoredTreaty } from '@/modules/treaty/schemas/Treaty.schema';
import { Resource } from 'db/schemas/Resource.schema';
import { Trade } from '@/modules/trade/schemas/Trade.schema';
import { ServerState } from '@/modules/treaty/schemas/ServerState.schema';
import { StoredEvent } from 'db/schemas/Event.schema';

export const schemas = [
  StoredTreaty,
  Resource,
  Trade,
  ServerState,
  StoredEvent,
];
