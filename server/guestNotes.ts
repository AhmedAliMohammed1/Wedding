import { createHash, randomUUID } from 'node:crypto';
import { isGuestNote, type GuestNote } from '../src/types/guestNote';

const DEFAULT_PAGE_SIZE = 6;
const MAX_PAGE_SIZE = 12;
const MAX_NAME_LENGTH = 60;
const MAX_MESSAGE_LENGTH = 500;
const MAX_BODY_LENGTH = 4_000;
const RATE_LIMIT_MAX_NOTES = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1_000;
export const GUEST_NOTES_API_VERSION = '2026-07-28.1';

export interface StoredGuestNote extends GuestNote {
  clientHash?: string;
}

export interface GuestNotesStore {
  readAll: () => Promise<unknown[]>;
  write: (note: StoredGuestNote) => Promise<void>;
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
      'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
      'Referrer-Policy': 'no-referrer',
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
    ? removeControlCharacters(value.normalize('NFC')).replace(/\s+/g, ' ').trim()
    : '';

const normalizeMessage = (value: unknown) =>
  typeof value === 'string'
    ? removeControlCharacters(value.normalize('NFC').replace(/\r\n?/g, '\n'), true)
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
    : '';

const containsUnsafeCode = (value: string) =>
  /<\s*\/?\s*[a-z][^>]*>/iu.test(value) ||
  /\b(?:javascript|vbscript)\s*:/iu.test(value) ||
  /\bon[a-z]+\s*=/iu.test(value) ||
  /(?:'\s*(?:or|and)\s*['"\d])|(?:;\s*(?:drop|delete|truncate|alter)\s+(?:table|database|schema)\b)|(?:\bunion\s+select\b)/iu.test(
    value
  );

const looksLikeSpam = (value: string) => {
  const compact = value.toLocaleLowerCase().replace(/[\s\p{P}\p{S}]/gu, '');
  const linkCount = value.match(/\b(?:https?:\/\/|www\.)/giu)?.length ?? 0;

  return (
    /(.)\1{15,}/u.test(value) ||
    (compact.length >= 24 && new Set([...compact]).size <= 2) ||
    linkCount > 1
  );
};

const isStoredGuestNote = (value: unknown): value is StoredGuestNote =>
  isGuestNote(value) &&
  (typeof (value as StoredGuestNote).clientHash === 'undefined' ||
    typeof (value as StoredGuestNote).clientHash === 'string');

const isSafeStoredNote = (note: StoredGuestNote) =>
  note.author.length >= 2 &&
  note.author.length <= MAX_NAME_LENGTH &&
  note.message.length >= 2 &&
  note.message.length <= MAX_MESSAGE_LENGTH &&
  !containsUnsafeCode(note.author) &&
  !containsUnsafeCode(note.message) &&
  !looksLikeSpam(note.author) &&
  !looksLikeSpam(note.message);

const toPublicNote = (note: StoredGuestNote): GuestNote => ({
  id: note.id,
  author: note.author,
  anonymous: note.anonymous,
  message: note.message,
  createdAt: note.createdAt
});

const positiveInteger = (value: string | null, fallback: number, maximum: number) => {
  if (!value || !/^\d+$/.test(value)) return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? Math.min(Math.max(parsed, 1), maximum) : fallback;
};

const paginationFor = (request: Request) => {
  const url = new URL(request.url);
  return {
    requestedPage: positiveInteger(url.searchParams.get('page'), 1, 10_000),
    pageSize: positiveInteger(url.searchParams.get('pageSize'), DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE)
  };
};

const clientHashFor = (request: Request) => {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const address =
    forwardedFor ||
    request.headers.get('x-real-ip')?.trim() ||
    request.headers.get('cf-connecting-ip')?.trim() ||
    'unknown';
  const userAgent = (request.headers.get('user-agent') || 'unknown').slice(0, 200);

  return createHash('sha256')
    .update(`${address.slice(0, 100)}|${userAgent}|wedding-guest-notes-v1`)
    .digest('hex');
};

const isSameOriginRequest = (request: Request) => {
  const origin = request.headers.get('origin');
  if (!origin) return true;

  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
};

const readNotes = async (request: Request, store: GuestNotesStore) => {
  const { requestedPage, pageSize } = paginationFor(request);
  const storedNotes = await store.readAll();
  const safeNotes = storedNotes
    .filter(isStoredGuestNote)
    .filter(isSafeStoredNote)
    .sort((first, second) => second.createdAt.localeCompare(first.createdAt));
  const total = safeNotes.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const start = (page - 1) * pageSize;

  return {
    notes: safeNotes.slice(start, start + pageSize).map(toPublicNote),
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages
    }
  };
};

const createNote = async (request: Request, store: GuestNotesStore) => {
  if (!isSameOriginRequest(request)) {
    return jsonResponse({ error: 'The note must be sent from this invitation page.' }, 403);
  }

  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return jsonResponse({ error: 'Please send the note as JSON.' }, 415);
  }

  const rawBody = await request.text();
  if (rawBody.length > MAX_BODY_LENGTH) {
    return jsonResponse({ error: 'That note is too large to send.' }, 413);
  }

  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(rawBody) as unknown;
  } catch {
    return jsonResponse({ error: 'The note details are not valid.' }, 400);
  }

  if (typeof parsedBody !== 'object' || parsedBody === null || Array.isArray(parsedBody)) {
    return jsonResponse({ error: 'The note details are not valid.' }, 400);
  }
  const body = parsedBody as Record<string, unknown>;

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

  if (containsUnsafeCode(name) || containsUnsafeCode(message)) {
    return jsonResponse(
      { error: 'Please write a plain-text note without HTML, scripts, or database commands.' },
      400
    );
  }

  if (looksLikeSpam(name) || looksLikeSpam(message)) {
    return jsonResponse(
      { error: 'Please write a genuine note without excessive repeated characters or links.' },
      400
    );
  }

  const clientHash = clientHashFor(request);
  const recentThreshold = Date.now() - RATE_LIMIT_WINDOW_MS;
  const storedNotes = await store.readAll();
  const recentNotesFromClient = storedNotes.filter(
    (storedNote) =>
      isStoredGuestNote(storedNote) &&
      storedNote.clientHash === clientHash &&
      Date.parse(storedNote.createdAt) >= recentThreshold
  ).length;

  if (recentNotesFromClient >= RATE_LIMIT_MAX_NOTES) {
    return jsonResponse(
      { error: 'Too many notes were sent from this device. Please wait ten minutes and try again.' },
      429,
      { 'Retry-After': String(RATE_LIMIT_WINDOW_MS / 1_000) }
    );
  }

  const note: StoredGuestNote = {
    id: randomUUID(),
    author: anonymous ? 'Anonymous' : name,
    anonymous,
    message,
    createdAt: new Date().toISOString(),
    clientHash
  };
  await store.write(note);

  return jsonResponse({ note: toPublicNote(note) }, 201);
};

export const handleGuestNotesRequest = async (request: Request, store: GuestNotesStore) => {
  try {
    if (request.method === 'GET') {
      return jsonResponse(await readNotes(request, store));
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
