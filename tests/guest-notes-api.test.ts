import { beforeEach, describe, expect, it, vi } from 'vitest';

const blobMocks = vi.hoisted(() => ({
  get: vi.fn(),
  list: vi.fn(),
  setJSON: vi.fn()
}));

vi.mock('@netlify/blobs', () => ({
  getStore: () => blobMocks
}));

import notesHandler, { config } from '../netlify/functions/notes.mts';
import type { GuestNote } from '../src/types/guestNote';

beforeEach(() => {
  blobMocks.get.mockReset();
  blobMocks.list.mockReset();
  blobMocks.setJSON.mockReset();
  blobMocks.list.mockResolvedValue({ blobs: [], directories: [] });
  blobMocks.setJSON.mockResolvedValue(undefined);
});

describe('guest notes API', () => {
  it('stores a validated anonymous note without a visitor name', async () => {
    const request = new Request('https://example.com/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        anonymous: true,
        name: 'This name must not be stored',
        message: 'Wishing you both a beautiful life together.',
        website: ''
      })
    });

    const response = await notesHandler(request, {} as never);
    const data = (await response.json()) as { note: { author: string; anonymous: boolean } };

    expect(response.status).toBe(201);
    expect(data.note).toMatchObject({ author: 'Anonymous', anonymous: true });
    expect(blobMocks.setJSON).toHaveBeenCalledOnce();
    const storedNote = blobMocks.setJSON.mock.calls[0]?.[1] as GuestNote;
    expect(storedNote).toMatchObject({
      author: 'Anonymous',
      anonymous: true
    });
    expect(storedNote.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(storedNote).toHaveProperty('clientHash');
  });

  it('rejects invalid or automated submissions before storage', async () => {
    const request = new Request('https://example.com/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        anonymous: false,
        name: 'A',
        message: 'Hello',
        website: 'filled-by-a-bot.example'
      })
    });

    const response = await notesHandler(request, {} as never);

    expect(response.status).toBe(400);
    expect(blobMocks.setJSON).not.toHaveBeenCalled();
  });

  it('returns all saved notes newest first', async () => {
    blobMocks.list.mockResolvedValue({
      blobs: [{ key: 'notes/older.json' }, { key: 'notes/newer.json' }],
      directories: []
    });
    blobMocks.get.mockImplementation((key: string) =>
      Promise.resolve(
        key.includes('newer')
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
    );

    const response = await notesHandler(new Request('https://example.com/api/notes'), {} as never);
    const data = (await response.json()) as {
      notes: Array<{ id: string }>;
      pagination: { page: number; total: number; totalPages: number };
    };

    expect(response.status).toBe(200);
    expect(data.notes.map((note) => note.id)).toEqual(['newer', 'older']);
    expect(data.pagination).toMatchObject({ page: 1, total: 2, totalPages: 1 });
  });

  it('returns a traceable runtime error instead of a generic unavailable response', async () => {
    blobMocks.list.mockRejectedValueOnce(new TypeError('simulated runtime failure'));

    const response = await notesHandler(new Request('https://example.com/api/notes'), {} as never);
    const data = (await response.json()) as { error: string };

    expect(response.status).toBe(500);
    expect(response.headers.get('X-Guest-Notes-Error')).toBe('runtime');
    expect(response.headers.get('X-Guest-Notes-Reference')).toMatch(/^[0-9a-f]{8}$/);
    expect(response.headers.get('X-Guest-Notes-Version')).toBe('2026-07-28.1');
    expect(data.error).toMatch(/TypeError.*reference [0-9a-f]{8}/i);
  });

  it('publishes the shared API path with per-IP rate limiting', () => {
    expect(config.path).toBe('/api/notes');
    expect(config.rateLimit).toMatchObject({
      aggregateBy: ['ip'],
      windowLimit: 5,
      windowSize: 600
    });
  });

  it.each([
    ['script markup', "<script>alert('xss')</script>"],
    ['SQL injection text', "' OR '1'='1'; DROP TABLE users;--"],
    ['repeated-character spam', 'A'.repeat(500)]
  ])('rejects %s before storage', async (_label, message) => {
    const response = await notesHandler(
      new Request('https://example.com/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anonymous: true,
          name: '',
          message,
          website: ''
        })
      }),
      {} as never
    );

    expect(response.status).toBe(400);
    expect(blobMocks.list).not.toHaveBeenCalled();
    expect(blobMocks.setJSON).not.toHaveBeenCalled();
  });
});
