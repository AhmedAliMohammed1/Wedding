import {
  BlobAccessError,
  BlobNotFoundError,
  BlobServiceNotAvailable,
  BlobServiceRateLimited,
  BlobStoreNotFoundError,
  BlobStoreSuspendedError,
  get,
  list,
  put,
  type BlobAccessType,
  type ListBlobResultBlob
} from '@vercel/blob';
import {
  GUEST_NOTES_API_VERSION,
  GuestNotesStorageError,
  handleGuestNotesRequest,
  type GuestNotesStore
} from '../server/guestNotes';
import type { GuestNote } from '../src/types/guestNote';

const NOTES_PREFIX = 'wedding-guest-notes/notes/';
const READ_BATCH_SIZE = 20;
const BLOB_ACCESS_MODES: BlobAccessType[] = ['private', 'public'];

const storageNotConfigured = () =>
  Response.json(
    {
      error:
        'Guest notes need a Vercel Blob store. In Vercel, open Storage, create a Blob store, connect it to this project, and redeploy.'
    },
    {
      status: 424,
      headers: {
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        'X-Guest-Notes-Version': GUEST_NOTES_API_VERSION
      }
    }
  );

const storageErrorFor = (error: unknown) => {
  if (error instanceof GuestNotesStorageError) return error;

  if (error instanceof BlobAccessError) {
    return new GuestNotesStorageError(
      'Vercel cannot access the connected Blob store. Reconnect the Blob store to this project, confirm BLOB_READ_WRITE_TOKEN is enabled for Production, and redeploy.'
    );
  }

  if (error instanceof BlobStoreNotFoundError) {
    return new GuestNotesStorageError(
      'The connected Vercel Blob store no longer exists. Create or reconnect a Blob store in the Vercel project, then redeploy.'
    );
  }

  if (error instanceof BlobStoreSuspendedError) {
    return new GuestNotesStorageError(
      'The connected Vercel Blob store is suspended. Restore it in Vercel Storage or connect another Blob store, then redeploy.'
    );
  }

  if (error instanceof BlobServiceRateLimited) {
    return new GuestNotesStorageError(
      'Vercel Blob is receiving too many requests. Please wait a minute and try the note again.',
      429
    );
  }

  if (error instanceof BlobServiceNotAvailable) {
    return new GuestNotesStorageError(
      'Vercel Blob is temporarily unavailable. Please wait a moment and try the note again.'
    );
  }

  return new GuestNotesStorageError(
    'Vercel Blob could not load or save the notes. Reconnect the Blob store to this project and redeploy; if it continues, check the /api/notes Function log in Vercel.'
  );
};

export const createVercelGuestNotesStore = (): GuestNotesStore => {
  let preferredAccess: BlobAccessType = 'private';

  const withDetectedAccess = async <Result>(
    operation: (access: BlobAccessType) => Promise<Result>
  ): Promise<Result> => {
    const accessModes =
      preferredAccess === 'private' ? BLOB_ACCESS_MODES : [...BLOB_ACCESS_MODES].reverse();
    let lastAccessError: unknown;

    for (const access of accessModes) {
      try {
        const result = await operation(access);
        preferredAccess = access;
        return result;
      } catch (error) {
        if (error instanceof BlobAccessError) {
          lastAccessError = error;
          continue;
        }

        throw error;
      }
    }

    throw lastAccessError;
  };

  const listAllNoteBlobs = async () => {
    const blobs: ListBlobResultBlob[] = [];
    let cursor: string | undefined;
    let hasMore = true;

    try {
      while (hasMore) {
        const page = await list({
          prefix: NOTES_PREFIX,
          limit: 1_000,
          cursor
        });
        blobs.push(...page.blobs);
        cursor = page.cursor;
        hasMore = page.hasMore;
      }
    } catch (error) {
      throw storageErrorFor(error);
    }

    return blobs;
  };

  const readBlobJson = async (pathname: string): Promise<unknown> => {
    try {
      const result = await withDetectedAccess((access) =>
        get(pathname, {
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
      if (error instanceof BlobNotFoundError) return null;
      throw storageErrorFor(error);
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

    async write(note: GuestNote) {
      const timestamp = Date.parse(note.createdAt).toString().padStart(13, '0');

      try {
        await withDetectedAccess((access) =>
          put(`${NOTES_PREFIX}${timestamp}-${note.id}.json`, JSON.stringify(note), {
            access,
            contentType: 'application/json',
            cacheControlMaxAge: 60
          })
        );
      } catch (error) {
        throw storageErrorFor(error);
      }
    }
  };
};

export const vercelGuestNotesStore = createVercelGuestNotesStore();

const handler = {
  fetch(request: Request) {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return storageNotConfigured();
    }

    return handleGuestNotesRequest(request, vercelGuestNotesStore);
  }
};

export default handler;
