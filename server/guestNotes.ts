import { randomUUID } from 'node:crypto';
import { isGuestNote, type GuestNote } from '../src/types/guestNote';

const MAX_NAME_LENGTH = 60;
const MAX_MESSAGE_LENGTH = 500;
const MAX_BODY_LENGTH = 4_000;
export const GUEST_NOTES_API_VERSION = '2026-07-27.4';

export interface GuestNotesStore {
  readAll: () => Promise<unknown[]>;
  write: (note: GuestNote) => Promise<void>;
}

export class GuestNotesStorageError extends Error {
  constructor(
    message: string,
    public readonly status = 503
  ) {
    super(message);
    this.name = 'GuestNotesStorageError';
  }
}

const jsonResponse = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'X-Guest-Notes-Version': GUEST_NOTES_API_VERSION,
      ...headers
    }
  });

const removeControlCharacters = (value: string, preserveWhitespace = false) =>
  [...value]
    .filter((character) => {
      const code = character.charCodeAt(0);
      return (preserveWhitespace && (character === '\n' || character === '\t')) || (code >= 32 && code !== 127);
    })
    .join('');

const normalizeName = (value: unknown) =>
  typeof value === 'string'
    ? removeControlCharacters(value).replace(/\s+/g, ' ').trim()
    : '';

const normalizeMessage = (value: unknown) =>
  typeof value === 'string'
    ? removeControlCharacters(value.replace(/\r\n?/g, '\n'), true)
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
    : '';

const readNotes = async (store: GuestNotesStore) => {
  const storedNotes = await store.readAll();

  return storedNotes
    .filter(isGuestNote)
    .sort((first, second) => second.createdAt.localeCompare(first.createdAt));
};

const createNote = async (request: Request, store: GuestNotesStore) => {
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return jsonResponse({ error: 'Please send the note as JSON.' }, 415);
  }

  const rawBody = await request.text();
  if (rawBody.length > MAX_BODY_LENGTH) {
    return jsonResponse({ error: 'That note is too large to send.' }, 413);
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return jsonResponse({ error: 'The note details are not valid.' }, 400);
  }

  if (typeof body.website === 'string' && body.website.trim()) {
    return jsonResponse({ error: 'The note could not be accepted.' }, 400);
  }

  const anonymous = body.anonymous === true;
  const name = normalizeName(body.name);
  const message = normalizeMessage(body.message);

  if (!anonymous && (name.length < 2 || name.length > MAX_NAME_LENGTH)) {
    return jsonResponse({ error: 'Please enter a name between 2 and 60 characters.' }, 400);
  }

  if (message.length < 2 || message.length > MAX_MESSAGE_LENGTH) {
    return jsonResponse({ error: 'Please write a note between 2 and 500 characters.' }, 400);
  }

  const note: GuestNote = {
    id: randomUUID(),
    author: anonymous ? 'Anonymous' : name,
    anonymous,
    message,
    createdAt: new Date().toISOString()
  };
  await store.write(note);

  return jsonResponse({ note }, 201);
};

export const handleGuestNotesRequest = async (request: Request, store: GuestNotesStore) => {
  try {
    if (request.method === 'GET') {
      return jsonResponse({ notes: await readNotes(store) });
    }

    if (request.method === 'POST') {
      return await createNote(request, store);
    }

    return new Response(null, {
      status: 405,
      headers: {
        Allow: 'GET, POST',
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    if (error instanceof GuestNotesStorageError) {
      console.error('Guest notes storage request failed', error);
      return jsonResponse({ error: error.message }, error.status, {
        'X-Guest-Notes-Error': 'storage'
      });
    }

    const errorReference = randomUUID().slice(0, 8);
    const errorType = error instanceof Error ? error.name : 'UnknownError';
    console.error(`Guest notes runtime request failed [${errorReference}]`, error);

    return jsonResponse(
      {
        error:
          `The guest-notes function encountered ${errorType} ` +
          `(reference ${errorReference}). Check this reference in your /api/notes Function log.`
      },
      500,
      {
        'X-Guest-Notes-Error': 'runtime',
        'X-Guest-Notes-Reference': errorReference
      }
    );
  }
};
