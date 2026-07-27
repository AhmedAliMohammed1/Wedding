import { getStore } from '@netlify/blobs';
import type { Config, Context } from '@netlify/functions';
import { handleGuestNotesRequest, type GuestNotesStore } from '../../server/guestNotes';
import type { GuestNote } from '../../src/types/guestNote';

const STORE_NAME = 'wedding-guest-notes';

const netlifyGuestNotesStore: GuestNotesStore = {
  async readAll() {
    const store = getStore({ name: STORE_NAME, consistency: 'strong' });
    const { blobs } = await store.list({ prefix: 'notes/' });
    return await Promise.all(blobs.map(({ key }) => store.get(key, { type: 'json' })));
  },

  async write(note: GuestNote) {
    const key = `notes/${Date.parse(note.createdAt).toString().padStart(13, '0')}-${note.id}.json`;
    const store = getStore({ name: STORE_NAME, consistency: 'strong' });
    await store.setJSON(key, note);
  }
};

export default (request: Request, _context: Context) =>
  handleGuestNotesRequest(request, netlifyGuestNotesStore);

export const config: Config = {
  path: '/api/notes',
  rateLimit: {
    windowLimit: 30,
    windowSize: 60,
    aggregateBy: ['ip']
  }
};
