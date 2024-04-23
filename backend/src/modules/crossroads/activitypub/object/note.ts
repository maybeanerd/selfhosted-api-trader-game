import { getNoteUrl } from '@/modules/crossroads/activitypub/utils/apUrl';
import type { APNote, APRoot } from 'activitypub-types';
import { randomUUID } from 'crypto';

function generateNoteId(): string {
  const uuid = randomUUID();

  const url = getNoteUrl(uuid);
  return url.toString();
}

export enum SupportedObjectType {
  'Note' = 'Note',
}

export function createNote(
  actorId: string,
  content: string,
  {
    inReplyTo,
  }: {
    inReplyTo?: string;
  },
): APRoot<APNote> {
  const post: APRoot<APNote> = {
    id: generateNoteId(),
    type: SupportedObjectType.Note,
    published: new Date().toISOString(),
    attributedTo: actorId,
    content,
    inReplyTo,
    to: 'https://www.w3.org/ns/activitystreams#Public',
  };

  return post;
}

// TODO save and get from DB
