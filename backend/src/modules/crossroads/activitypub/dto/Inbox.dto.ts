import { SupportedActivityType } from '@/modules/crossroads/activitypub/activity';
import { SupportedActorType } from '@/modules/crossroads/activitypub/actor/types';
import { SupportedObjectType } from '@/modules/crossroads/activitypub/object';
import { ResourceType } from '@/modules/resource/types';
import { z } from 'zod';

const activityPubId = z.string().url();

const jsonLdContext = z
  .string()
  .or(
    z.array(
      z
        .string()
        .or(
          z.record(z.string(), z.string().or(z.record(z.string(), z.string()))),
        ),
    ),
  );

export const publicKeyDto = z.object({
  id: activityPubId,
  owner: activityPubId,
  publicKeyPem: z.string(),
});

export const activityPubActorDto = z.object({
  '@context': jsonLdContext.optional(),
  id: activityPubId,
  type: z.nativeEnum(SupportedActorType),
  preferredUsername: z.string().default('noname'),
  inbox: z.string().url(),
  outbox: z.string().url(),
  publicKey: activityPubId.or(publicKeyDto),
});

export const inboxActivityActor = activityPubId.or(activityPubActorDto);

export const inboxActivityGameObject = z.object({
  requestedResources: z.array(
    z.object({
      type: z.nativeEnum(ResourceType),
      amount: z.number(),
    }),
  ),
  offeredResources: z.array(
    z.object({
      type: z.nativeEnum(ResourceType),
      amount: z.number(),
    }),
  ),
});

export const activityPubObjectDto = z.object({
  '@context': jsonLdContext.optional(),
  id: activityPubId,
  type: z.nativeEnum(SupportedObjectType),
  published: z.string().datetime(),
  attributedTo: inboxActivityActor,
  content: z.string(),
  gameContent: inboxActivityGameObject,
  to: z.string().or(z.array(z.string()).min(1)),
  inReplyTo: inboxActivityActor.optional(),
});

export const inboxActivityObject = activityPubId.or(activityPubObjectDto).or(
  // Activity.object can also reference another activity
  z.object({
    id: activityPubId,
    type: z.nativeEnum(SupportedActivityType),
    actor: inboxActivityActor,
    object: activityPubId.or(activityPubObjectDto),
  }),
);

export const inboxActivity = z.object({
  '@context': jsonLdContext.optional(),
  id: activityPubId,
  type: z.nativeEnum(SupportedActivityType),
  actor: inboxActivityActor,
  object: inboxActivityObject,
});
export type InboxActivity = z.infer<typeof inboxActivity>;

export const inboxActivities = inboxActivity.or(z.array(inboxActivity).min(1));
export type InboxActivities = z.infer<typeof inboxActivities>;
