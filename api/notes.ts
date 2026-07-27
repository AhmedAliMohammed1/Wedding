import { get, list, put } from '@vercel/blob';
import { handleGuestNotesRequest, type GuestNotesStore } from '../server/guestNotes';
import type { GuestNote } from '../src/types/guestNote';

const NOTES_PREFIX = 'wedding-guest-notes/notes/';
const READ_BATCH_SIZE = 20;

const storageNotConfigured = () =>
  Response.json(
    {
      error:
        'Guest notes need a Vercel Blob store. In Vercel, open Storage, create a Private Blob store, connect it to this project, and redeploy.'
    },
    {
      status: 424,
      headers: {
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff'
      }
    }
  );

const listAllNoteBlobs = async () => {
  const blobs = [];
  let cursor: string | undefined;
  let hasMore = true;

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

  return blobs;
};

const readBlobJson = async (pathname: string): Promise<unknown> => {
  const result = await get(pathname, {
    access: 'private',
    useCache: false
  });

  if (result?.statusCode !== 200 || !result.stream) return null;

  try {
    return await new Response(result.stream).json();
  } catch {
    return null;
  }
};

export const vercelGuestNotesStore: GuestNotesStore = {
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
    await put(`${NOTES_PREFIX}${timestamp}-${note.id}.json`, JSON.stringify(note), {
      access: 'private',
      contentType: 'application/json',
      cacheControlMaxAge: 60
    });
  }
};

const handler = {
  fetch(request: Request) {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return storageNotConfigured();
    }

    return handleGuestNotesRequest(request, vercelGuestNotesStore);
  }
};

export default handler;
