import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const blobMocks = vi.hoisted(() => ({
  get: vi.fn(),
  list: vi.fn(),
  put: vi.fn()
}));

vi.mock('@vercel/blob', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@vercel/blob')>();
  return {
    ...actual,
    ...blobMocks
  };
});

import { BlobAccessError, BlobStoreNotFoundError } from '@vercel/blob';
import notesHandler, { createVercelGuestNotesStore } from '../api/notes';
import type { GuestNote } from '../src/types/guestNote';

const blobResult = (note: unknown) => ({
  statusCode: 200,
  stream: new Response(JSON.stringify(note)).body
});

beforeEach(() => {
  blobMocks.get.mockReset();
  blobMocks.list.mockReset();
  blobMocks.put.mockReset();
  blobMocks.list.mockResolvedValue({ blobs: [], hasMore: false });
  blobMocks.put.mockResolvedValue({});
  vi.stubEnv('BLOB_READ_WRITE_TOKEN', 'vercel-test-token');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Vercel guest notes API', () => {
  it('stores a validated note in private Vercel Blob storage', async () => {
    const request = new Request('https://wedding.example/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        anonymous: false,
        name: 'Salma',
        message: 'Wishing you a lifetime of love.',
        website: ''
      })
    });

    const response = await notesHandler.fetch(request);
    const data = (await response.json()) as { note: { author: string; id: string } };

    expect(response.status).toBe(201);
    expect(data.note).toMatchObject({ author: 'Salma' });
    expect(data.note.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(blobMocks.put).toHaveBeenCalledOnce();
    expect(blobMocks.put.mock.calls[0]?.[0]).toMatch(
      new RegExp(`^wedding-guest-notes/notes/\\d{13}-${data.note.id}\\.json$`)
    );
    expect(JSON.parse(blobMocks.put.mock.calls[0]?.[1] as string)).toMatchObject({
      author: 'Salma',
      message: 'Wishing you a lifetime of love.'
    });
    expect(blobMocks.put.mock.calls[0]?.[2]).toMatchObject({
      access: 'private',
      contentType: 'application/json'
    });
  });

  it('automatically retries with public access when the connected store is public', async () => {
    const store = createVercelGuestNotesStore();
    const note: GuestNote = {
      id: 'public-store-note',
      author: 'Anonymous',
      anonymous: true,
      message: 'A note stored in the connected public Blob store.',
      createdAt: '2026-07-27T12:00:00.000Z'
    };
    blobMocks.put.mockRejectedValueOnce(new BlobAccessError()).mockResolvedValueOnce({});

    await store.write(note);

    expect(blobMocks.put).toHaveBeenCalledTimes(2);
    expect(blobMocks.put.mock.calls[0]?.[2]).toMatchObject({ access: 'private' });
    expect(blobMocks.put.mock.calls[1]?.[2]).toMatchObject({ access: 'public' });
  });

  it('reads all stored note pages and returns notes newest first', async () => {
    blobMocks.list
      .mockResolvedValueOnce({
        blobs: [{ pathname: 'wedding-guest-notes/notes/older.json' }],
        cursor: 'next-page',
        hasMore: true
      })
      .mockResolvedValueOnce({
        blobs: [{ pathname: 'wedding-guest-notes/notes/newer.json' }],
        hasMore: false
      });
    blobMocks.get.mockImplementation((pathname: string) =>
      Promise.resolve(
        blobResult(
          pathname.includes('newer')
            ? {
                id: 'newer',
                author: 'Mariam',
                anonymous: false,
                message: 'The newest note',
                createdAt: '2026-07-27T12:00:00.000Z'
              }
            : {
                id: 'older',
                author: 'Anonymous',
                anonymous: true,
                message: 'The older note',
                createdAt: '2026-07-26T12:00:00.000Z'
              }
        )
      )
    );

    const response = await notesHandler.fetch(new Request('https://wedding.example/api/notes'));
    const data = (await response.json()) as { notes: Array<{ id: string }> };

    expect(response.status).toBe(200);
    expect(data.notes.map((note) => note.id)).toEqual(['newer', 'older']);
    expect(blobMocks.list).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ cursor: 'next-page' })
    );
    expect(blobMocks.get).toHaveBeenCalledTimes(2);
    expect(blobMocks.get).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ access: 'private', useCache: false })
    );
  });

  it('returns clear setup guidance when the Blob store is not connected', async () => {
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', '');

    const response = await notesHandler.fetch(new Request('https://wedding.example/api/notes'));
    const data = (await response.json()) as { error: string };

    expect(response.status).toBe(424);
    expect(data.error).toMatch(/create a Blob store/i);
    expect(blobMocks.list).not.toHaveBeenCalled();
  });

  it('returns an actionable controlled error when the connected store no longer exists', async () => {
    blobMocks.list.mockRejectedValueOnce(new BlobStoreNotFoundError());

    const response = await notesHandler.fetch(new Request('https://wedding.example/api/notes'));
    const data = (await response.json()) as { error: string };

    expect(response.status).toBe(503);
    expect(response.headers.get('X-Guest-Notes-Error')).toBe('storage');
    expect(data.error).toMatch(/create or reconnect a Blob store/i);
  });

  it('identifies unexpected storage failures instead of returning the generic unavailable error', async () => {
    blobMocks.list.mockRejectedValueOnce(new TypeError('simulated runtime failure'));

    const response = await notesHandler.fetch(new Request('https://wedding.example/api/notes'));
    const data = (await response.json()) as { error: string };

    expect(response.status).toBe(503);
    expect(response.headers.get('X-Guest-Notes-Error')).toBe('storage');
    expect(response.headers.get('X-Guest-Notes-Version')).toBe('2026-07-27.4');
    expect(data.error).toMatch(/check the \/api\/notes Function log/i);
  });
});
