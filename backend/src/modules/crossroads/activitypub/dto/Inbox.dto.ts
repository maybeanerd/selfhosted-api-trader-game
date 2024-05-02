import { SupportedActivityType } from '@/modules/crossroads/activitypub/activity';
import { SupportedActorType } from '@/modules/crossroads/activitypub/actor/types';
import { SupportedObjectType } from '@/modules/crossroads/activitypub/object';
import { z } from 'zod';

const activityPubId = z.string().url();

const publicKey = activityPubId.or(
  z.object({
    id: activityPubId,
    owner: activityPubId,
    publicKeyPem: z.string(),
  }),
);

export const inboxActivityActor = activityPubId.or(
  z.object({
    id: activityPubId,
    type: z.nativeEnum(SupportedActorType),
    preferredUsername: z.string().default('noname'),
    inbox: z.string().url(),
    outbox: z.string().url(),
    publicKey: publicKey,
  }),
);

export const inboxActivityObject = activityPubId.or(
  z.object({
    id: activityPubId,
    type: z.nativeEnum(SupportedObjectType),
    published: z.string().datetime(),
    attributedTo: inboxActivityActor,
    content: z.string(),
    to: z.string(),
    inReplyTo: inboxActivityActor.optional(),
    internalId: z.string().uuid().optional(),
  }),
);

export const inboxActivity = z.object({
  id: activityPubId,
  type: z.nativeEnum(SupportedActivityType),
  actor: inboxActivityActor,
  object: inboxActivityObject,
});
export type InboxActivity = z.infer<typeof inboxActivity>;

export const inboxActivities = z.array(inboxActivity).min(1);
export type InboxActivities = z.infer<typeof inboxActivities>;
