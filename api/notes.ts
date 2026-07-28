import { createHash, randomUUID } from 'node:crypto';

const NOTES_PREFIX = 'wedding-guest-notes/notes/';
const READ_BATCH_SIZE = 20;
const DEFAULT_PAGE_SIZE = 6;
const MAX_PAGE_SIZE = 12;
const MAX_STORED_NOTES_SCAN = 500;
const MAX_NAME_LENGTH = 60;
const MAX_MESSAGE_LENGTH = 500;
const MAX_BODY_LENGTH = 4_000;
const RATE_LIMIT_MAX_NOTES = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1_000;
const API_VERSION = '2026-07-28.1';
const BLOB_ACCESS_MODES = ['private', 'public'] as const;
let blobClientPromise: Promise<typeof import('@vercel/blob')> | undefined;

type BlobAccess = (typeof BLOB_ACCESS_MODES)[number];

interface GuestNote {
  id: string;
  author: string;
  anonymous: boolean;
  message: string;
  createdAt: string;
}

interface StoredGuestNote extends GuestNote {
  clientHash?: string;
}

interface GuestNotesStore {
  readAll: () => Promise<unknown[]>;
  write: (note: StoredGuestNote) => Promise<void>;
}

class GuestNotesStorageError extends Error {
  readonly status: number;

  constructor(message: string, status = 503) {
    super(message);
    this.name = 'GuestNotesStorageError';
    this.status = status;
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
      'X-Guest-Notes-Version': API_VERSION,
      ...headers
    }
  });

const errorClassName = (error: unknown) =>
  error instanceof Error ? error.constructor.name : 'UnknownError';

const loadBlobClient = () => {
  blobClientPromise ??= import('@vercel/blob');
  return blobClientPromise;
};

const storageErrorFor = (error: unknown) => {
  if (error instanceof GuestNotesStorageError) return error;

  switch (errorClassName(error)) {
    case 'BlobAccessError':
      return new GuestNotesStorageError(
        'Vercel cannot access the connected Blob store. Reconnect it, confirm BLOB_STORE_ID is enabled for Production (or BLOB_READ_WRITE_TOKEN for an older connection), and redeploy.'
      );
    case 'BlobStoreNotFoundError':
      return new GuestNotesStorageError(
        'The connected Vercel Blob store no longer exists. Create or reconnect a Blob store in the Vercel project, then redeploy.'
      );
    case 'BlobStoreSuspendedError':
      return new GuestNotesStorageError(
        'The connected Vercel Blob store is suspended. Restore it in Vercel Storage or connect another Blob store, then redeploy.'
      );
    case 'BlobServiceRateLimited':
      return new GuestNotesStorageError(
        'Vercel Blob is receiving too many requests. Please wait a minute and try the note again.',
        429
      );
    case 'BlobServiceNotAvailable':
      return new GuestNotesStorageError(
        'Vercel Blob is temporarily unavailable. Please wait a moment and try the note again.'
      );
    default:
      return new GuestNotesStorageError(
        `The Vercel Blob adapter encountered ${errorClassName(error)}. ` +
          'Reconnect the Blob store and check the /api/notes Function log.'
      );
  }
};

const storageErrorResponse = (error: unknown) => {
  const storageError = storageErrorFor(error);
  const errorReference = randomUUID().slice(0, 8);
  console.error(`Guest notes storage request failed [${errorReference}]`, error);

  return jsonResponse(
    {
      error: `${storageError.message} Reference ${errorReference}.`
    },
    storageError.status,
    {
      'X-Guest-Notes-Error': 'storage',
      'X-Guest-Notes-Reference': errorReference
    }
  );
};

const runtimeErrorResponse = (error: unknown) => {
  const errorReference = randomUUID().slice(0, 8);
  console.error(`Guest notes runtime request failed [${errorReference}]`, error);

  return jsonResponse(
    {
      error:
        `The guest-notes function encountered ${errorClassName(error)} ` +
        `(reference ${errorReference}). Check this reference in the /api/notes Function log.`
    },
    500,
    {
      'X-Guest-Notes-Error': 'runtime',
      'X-Guest-Notes-Reference': errorReference
    }
  );
};

const storageNotConfigured = () =>
  jsonResponse(
    {
      error:
        'Guest notes need a Vercel Blob store. In Vercel, open Storage, create a Blob store, connect it to this project, and redeploy.'
    },
    424,
    {
      'X-Guest-Notes-Error': 'storage'
    }
  );

const removeControlCharacters = (value: string, preserveWhitespace = false) =>
  [...value]
    .filter((character) => {
      const code = character.charCodeAt(0);
      return (
        (preserveWhitespace && (character === '\n' || character === '\t')) ||
        (code >= 32 && code !== 127)
      );
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

const isGuestNote = (value: unknown): value is GuestNote => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const note = value as Record<string, unknown>;

  return (
    typeof note.id === 'string' &&
    typeof note.author === 'string' &&
    typeof note.anonymous === 'boolean' &&
    typeof note.message === 'string' &&
    typeof note.createdAt === 'string'
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

export const createVercelGuestNotesStore = (): GuestNotesStore => {
  let preferredAccess: BlobAccess = 'private';

  const withDetectedAccess = async <Result>(
    operation: (
      client: typeof import('@vercel/blob'),
      access: BlobAccess
    ) => Promise<Result>
  ): Promise<Result> => {
    const client = await loadBlobClient();
    const accessModes: BlobAccess[] =
      preferredAccess === 'private' ? [...BLOB_ACCESS_MODES] : ['public', 'private'];
    let lastAccessError: unknown;

    for (const access of accessModes) {
      try {
        const result = await operation(client, access);
        preferredAccess = access;
        return result;
      } catch (error) {
        if (errorClassName(error) === 'BlobAccessError') {
          lastAccessError = error;
          continue;
        }

        throw error;
      }
    }

    throw lastAccessError;
  };

  const listAllNoteBlobs = async () => {
    const client = await loadBlobClient();
    const blobs: Array<{ pathname: string }> = [];
    let cursor: string | undefined;
    let hasMore = true;

    while (hasMore) {
      const page = await client.list({
        prefix: NOTES_PREFIX,
        limit: 1_000,
        cursor
      });
      blobs.push(...page.blobs);
      cursor = page.cursor;
      hasMore = page.hasMore;
    }

    return blobs;
  };

  const readBlobJson = async (pathname: string): Promise<unknown> => {
    try {
      const result = await withDetectedAccess((client, access) =>
        client.get(pathname, {
          access,
          useCache: false
        })
      );

      if (result?.statusCode !== 200 || !result.stream) return null;

      try {
        return await new Response(result.stream).json();
      } catch {
        return null;
      }
    } catch (error) {
      if (errorClassName(error) === 'BlobNotFoundError') return null;
      throw error;
    }
  };

  return {
    async readAll() {
      const blobs = (await listAllNoteBlobs())
        .sort((first, second) => second.pathname.localeCompare(first.pathname))
        .slice(0, MAX_STORED_NOTES_SCAN);
      const notes: unknown[] = [];

      for (let index = 0; index < blobs.length; index += READ_BATCH_SIZE) {
        const batch = blobs.slice(index, index + READ_BATCH_SIZE);
        notes.push(...(await Promise.all(batch.map((blob) => readBlobJson(blob.pathname)))));
      }

      return notes;
    },

    async write(note) {
      const timestamp = Date.parse(note.createdAt).toString().padStart(13, '0');

      await withDetectedAccess((client, access) =>
        client.put(`${NOTES_PREFIX}${timestamp}-${note.id}.json`, JSON.stringify(note), {
          access,
          contentType: 'application/json',
          cacheControlMaxAge: 60
        })
      );
    }
  };
};

const vercelGuestNotesStore = createVercelGuestNotesStore();

const readStoredNotes = async () => {
  const storedNotes = await vercelGuestNotesStore.readAll();
  return storedNotes
    .filter(isStoredGuestNote)
    .filter(isSafeStoredNote)
    .sort((first, second) => second.createdAt.localeCompare(first.createdAt));
};

const createNote = async (request: Request) => {
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
  const storedNotes = await vercelGuestNotesStore.readAll();
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

  await vercelGuestNotesStore.write(note);
  return jsonResponse({ note: toPublicNote(note) }, 201);
};

const handleRequest = async (request: Request) => {
  const hasBlobConnection = Boolean(
    process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN
  );
  if (!hasBlobConnection) return storageNotConfigured();

  try {
    if (request.method === 'GET') {
      const { requestedPage, pageSize } = paginationFor(request);
      const storedNotes = await readStoredNotes();
      const total = storedNotes.length;
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      const page = Math.min(requestedPage, totalPages);
      const start = (page - 1) * pageSize;

      return jsonResponse({
        notes: storedNotes.slice(start, start + pageSize).map(toPublicNote),
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
          hasPreviousPage: page > 1,
          hasNextPage: page < totalPages
        }
      });
    }

    if (request.method === 'POST') {
      return await createNote(request);
    }

    return new Response(null, {
      status: 405,
      headers: {
        Allow: 'GET, POST',
        'Cache-Control': 'no-store',
        'X-Guest-Notes-Version': API_VERSION
      }
    });
  } catch (error) {
    if (
      error instanceof GuestNotesStorageError ||
      errorClassName(error).startsWith('Blob') ||
      error instanceof TypeError
    ) {
      return storageErrorResponse(error);
    }

    return runtimeErrorResponse(error);
  }
};

export function GET(request: Request) {
  return handleRequest(request);
}

export function POST(request: Request) {
  return handleRequest(request);
}
