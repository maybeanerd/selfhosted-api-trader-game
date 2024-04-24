import { getNoteUrl } from '@/modules/crossroads/activitypub/utils/apUrl';
import { randomUUID } from 'crypto';

function generateNoteId(): {
  apId: string;
  id: string;
} {
  const uuid = randomUUID();

  const url = getNoteUrl(uuid);
  const apId = url.toString();

  return {
    apId,
    id: uuid,
  };
}

export enum SupportedObjectType {
  'Note' = 'Note',
}

type ActivityPubObject = {
  id: string;
  type: SupportedObjectType;
  published: Date;
  attributedTo: string;
  content: string;
  inReplyTo?: string;
  to: string;
};

export function createNote(
  actorId: string,
  content: string,
  {
    inReplyTo,
  }: {
    inReplyTo?: string;
  },
): { note: ActivityPubObject; id: string } {
  const { apId, id } = generateNoteId();
  const note: ActivityPubObject = {
    id: apId,
    type: SupportedObjectType.Note,
    published: new Date(),
    attributedTo: actorId,
    content,
    inReplyTo,
    to: 'https://www.w3.org/ns/activitystreams#Public',
  };

  return { note, id };
}

// TODO save and get from DB
