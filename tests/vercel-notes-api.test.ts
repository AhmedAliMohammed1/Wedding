import { createHash } from 'node:crypto';
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
import { GET, POST, createVercelGuestNotesStore } from '../api/notes';
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
  vi.stubEnv('BLOB_STORE_ID', '');
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

    const response = await POST(request);
    const data = (await response.json()) as { note: { author: string; id: string } };

    expect(response.status).toBe(201);
    expect(data.note).toMatchObject({ author: 'Salma' });
    expect(data.note.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(blobMocks.put).toHaveBeenCalledOnce();
    expect(blobMocks.put.mock.calls[0]?.[0]).toMatch(
      new RegExp(`^wedding-guest-notes/notes/\\d{13}-${data.note.id}\\.json$`)
    );
    const storedPayload = JSON.parse(blobMocks.put.mock.calls[0]?.[1] as string) as {
      author: string;
      message: string;
      clientHash?: unknown;
    };
    expect(storedPayload).toMatchObject({
      author: 'Salma',
      message: 'Wishing you a lifetime of love.'
    });
    expect(storedPayload.clientHash).toMatch(/^[0-9a-f]{64}$/);
    expect(data.note).not.toHaveProperty('clientHash');
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

    const response = await GET(
      new Request('https://wedding.example/api/notes?page=1&pageSize=6')
    );
    const data = (await response.json()) as {
      notes: Array<{ id: string }>;
      pagination: { page: number; total: number; totalPages: number };
    };

    expect(response.status).toBe(200);
    expect(data.notes.map((note) => note.id)).toEqual(['newer', 'older']);
    expect(data.pagination).toMatchObject({ page: 1, total: 2, totalPages: 1 });
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
    vi.stubEnv('BLOB_STORE_ID', '');

    const response = await GET(new Request('https://wedding.example/api/notes'));
    const data = (await response.json()) as { error: string };

    expect(response.status).toBe(424);
    expect(data.error).toMatch(/create a Blob store/i);
    expect(blobMocks.list).not.toHaveBeenCalled();
  });

  it('uses a newly connected OIDC Blob store without a legacy read-write token', async () => {
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', '');
    vi.stubEnv('BLOB_STORE_ID', 'store_wedding_blob');

    const response = await GET(new Request('https://wedding.example/api/notes'));
    const data = (await response.json()) as {
      notes: unknown[];
      pagination: { total: number };
    };

    expect(response.status).toBe(200);
    expect(response.headers.get('X-Guest-Notes-Version')).toBe('2026-07-28.1');
    expect(data.notes).toEqual([]);
    expect(data.pagination.total).toBe(0);
    expect(blobMocks.list).toHaveBeenCalledOnce();
  });

  it('returns an actionable controlled error when the connected store no longer exists', async () => {
    blobMocks.list.mockRejectedValueOnce(new BlobStoreNotFoundError());

    const response = await GET(new Request('https://wedding.example/api/notes'));
    const data = (await response.json()) as { error: string };

    expect(response.status).toBe(503);
    expect(response.headers.get('X-Guest-Notes-Error')).toBe('storage');
    expect(data.error).toMatch(/create or reconnect a Blob store/i);
  });

  it('identifies unexpected storage failures instead of returning the generic unavailable error', async () => {
    blobMocks.list.mockRejectedValueOnce(new TypeError('simulated runtime failure'));

    const response = await GET(new Request('https://wedding.example/api/notes'));
    const data = (await response.json()) as { error: string };

    expect(response.status).toBe(503);
    expect(response.headers.get('X-Guest-Notes-Error')).toBe('storage');
    expect(response.headers.get('X-Guest-Notes-Version')).toBe('2026-07-28.1');
    expect(data.error).toMatch(/TypeError.*Reference [0-9a-f]{8}/i);
  });

  it.each([
    ['repeated-character spam', 'A'.repeat(500)],
    ['HTML or script injection', "<script>alert('xss')</script>"],
    ['SQL injection text', "' OR '1'='1'; DROP TABLE users;--"]
  ])('rejects %s before reading or writing Blob storage', async (_label, message) => {
    const response = await POST(
      new Request('https://wedding.example/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anonymous: true,
          name: '',
          message,
          website: ''
        })
      })
    );
    const data = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(data.error).toMatch(/plain-text|genuine note/i);
    expect(blobMocks.list).not.toHaveBeenCalled();
    expect(blobMocks.put).not.toHaveBeenCalled();
  });

  it('rejects cross-origin submission attempts', async () => {
    const response = await POST(
      new Request('https://wedding.example/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'https://attacker.example'
        },
        body: JSON.stringify({
          anonymous: true,
          name: '',
          message: 'A message submitted from another website.',
          website: ''
        })
      })
    );

    expect(response.status).toBe(403);
    expect(blobMocks.list).not.toHaveBeenCalled();
    expect(blobMocks.put).not.toHaveBeenCalled();
  });

  it('returns bounded pages instead of the entire notes collection', async () => {
    const notes = Array.from({ length: 8 }, (_, index) => ({
      id: `note-${index + 1}`,
      author: `Guest ${index + 1}`,
      anonymous: false,
      message: `A thoughtful wedding wish number ${index + 1}.`,
      createdAt: `2026-07-${String(20 + index).padStart(2, '0')}T12:00:00.000Z`
    }));
    blobMocks.list.mockResolvedValue({
      blobs: notes.map((note) => ({
        pathname: `wedding-guest-notes/notes/${Date.parse(note.createdAt)}-${note.id}.json`
      })),
      hasMore: false
    });
    blobMocks.get.mockImplementation((pathname: string) =>
      Promise.resolve(blobResult(notes.find((note) => pathname.includes(note.id))))
    );

    const response = await GET(
      new Request('https://wedding.example/api/notes?page=2&pageSize=3')
    );
    const data = (await response.json()) as {
      notes: Array<{ id: string }>;
      pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
        hasPreviousPage: boolean;
        hasNextPage: boolean;
      };
    };

    expect(response.status).toBe(200);
    expect(data.notes.map((note) => note.id)).toEqual(['note-5', 'note-4', 'note-3']);
    expect(data.pagination).toEqual({
      page: 2,
      pageSize: 3,
      total: 8,
      totalPages: 3,
      hasPreviousPage: true,
      hasNextPage: true
    });
    expect(blobMocks.get).toHaveBeenCalledTimes(8);
  });

  it('hides previously stored unsafe notes from every page', async () => {
    const storedNotes = [
      {
        id: 'safe',
        author: 'Mariam',
        anonymous: false,
        message: 'May your home always be filled with peace.',
        createdAt: '2026-07-28T12:00:00.000Z'
      },
      {
        id: 'script',
        author: 'Anonymous',
        anonymous: true,
        message: "<script>alert('xss')</script>",
        createdAt: '2026-07-28T11:00:00.000Z'
      },
      {
        id: 'spam',
        author: 'Anonymous',
        anonymous: true,
        message: 'A'.repeat(500),
        createdAt: '2026-07-28T10:00:00.000Z'
      }
    ];
    blobMocks.list.mockResolvedValue({
      blobs: storedNotes.map((note) => ({
        pathname: `wedding-guest-notes/notes/${Date.parse(note.createdAt)}-${note.id}.json`
      })),
      hasMore: false
    });
    blobMocks.get.mockImplementation((pathname: string) =>
      Promise.resolve(blobResult(storedNotes.find((note) => pathname.includes(note.id))))
    );

    const response = await GET(new Request('https://wedding.example/api/notes'));
    const data = (await response.json()) as {
      notes: Array<{ id: string }>;
      pagination: { total: number };
    };

    expect(data.notes.map((note) => note.id)).toEqual(['safe']);
    expect(data.pagination.total).toBe(1);
  });

  it('rate limits repeated submissions without storing raw visitor addresses', async () => {
    const clientHash = createHash('sha256')
      .update('203.0.113.8|Guest Browser|wedding-guest-notes-v1')
      .digest('hex');
    const recentNotes = Array.from({ length: 5 }, (_, index) => ({
      id: `recent-${index}`,
      author: 'Anonymous',
      anonymous: true,
      message: `A recent thoughtful wish number ${index + 1}.`,
      createdAt: new Date(Date.now() - index * 30_000).toISOString(),
      clientHash
    }));
    blobMocks.list.mockResolvedValue({
      blobs: recentNotes.map((note) => ({
        pathname: `wedding-guest-notes/notes/${Date.parse(note.createdAt)}-${note.id}.json`
      })),
      hasMore: false
    });
    blobMocks.get.mockImplementation((pathname: string) =>
      Promise.resolve(blobResult(recentNotes.find((note) => pathname.includes(note.id))))
    );

    const response = await POST(
      new Request('https://wedding.example/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Guest Browser',
          'X-Forwarded-For': '203.0.113.8'
        },
        body: JSON.stringify({
          anonymous: true,
          name: '',
          message: 'Another sincere wish for the happy couple.',
          website: ''
        })
      })
    );

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('600');
    expect(blobMocks.put).not.toHaveBeenCalled();
  });
});
