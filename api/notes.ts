import { randomUUID } from 'node:crypto';

const NOTES_PREFIX = 'wedding-guest-notes/notes/';
const READ_BATCH_SIZE = 20;
const MAX_NAME_LENGTH = 60;
const MAX_MESSAGE_LENGTH = 500;
const MAX_BODY_LENGTH = 4_000;
const API_VERSION = '2026-07-27.6';
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

interface GuestNotesStore {
  readAll: () => Promise<unknown[]>;
  write: (note: GuestNote) => Promise<void>;
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
    ? removeControlCharacters(value).replace(/\s+/g, ' ').trim()
    : '';

const normalizeMessage = (value: unknown) =>
  typeof value === 'string'
    ? removeControlCharacters(value.replace(/\r\n?/g, '\n'), true)
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
    : '';

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
      const blobs = await listAllNoteBlobs();
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
    .filter(isGuestNote)
    .sort((first, second) => second.createdAt.localeCompare(first.createdAt));
};

const createNote = async (request: Request) => {
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

  await vercelGuestNotesStore.write(note);
  return jsonResponse({ note }, 201);
};

const handleRequest = async (request: Request) => {
  const hasBlobConnection = Boolean(
    process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN
  );
  if (!hasBlobConnection) return storageNotConfigured();

  try {
    if (request.method === 'GET') {
      return jsonResponse({ notes: await readStoredNotes() });
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
