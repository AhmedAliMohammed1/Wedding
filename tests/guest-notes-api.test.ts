import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const blobMocks = vi.hoisted(() => ({
  get: vi.fn(),
  list: vi.fn(),
  setJSON: vi.fn()
}));

vi.mock('@netlify/blobs', () => ({
  getStore: () => blobMocks
}));

import notesHandler, { config } from '../netlify/functions/notes.mts';

beforeEach(() => {
  blobMocks.get.mockReset();
  blobMocks.list.mockReset();
  blobMocks.setJSON.mockReset();
  blobMocks.list.mockResolvedValue({ blobs: [], directories: [] });
  blobMocks.setJSON.mockResolvedValue(undefined);
  vi.stubGlobal('crypto', { randomUUID: () => 'generated-note-id' });
});

afterEach(() => {
  vi.unstubAllGlobals();
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
    expect(blobMocks.setJSON.mock.calls[0]?.[1]).toMatchObject({
      id: 'generated-note-id',
      author: 'Anonymous',
      anonymous: true
    });
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
    const data = (await response.json()) as { notes: Array<{ id: string }> };

    expect(response.status).toBe(200);
    expect(data.notes.map((note) => note.id)).toEqual(['newer', 'older']);
  });

  it('publishes the shared API path with per-IP rate limiting', () => {
    expect(config.path).toBe('/api/notes');
    expect(config.rateLimit).toMatchObject({
      aggregateBy: ['ip'],
      windowLimit: 30,
      windowSize: 60
    });
  });
});
