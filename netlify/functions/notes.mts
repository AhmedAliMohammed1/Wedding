import { getStore } from '@netlify/blobs';
import type { Config, Context } from '@netlify/functions';
import {
  handleGuestNotesRequest,
  type GuestNotesStore,
  type StoredGuestNote
} from '../../server/guestNotes';

const STORE_NAME = 'wedding-guest-notes';
const MAX_STORED_NOTES_SCAN = 500;

const netlifyGuestNotesStore: GuestNotesStore = {
  async readAll() {
    const store = getStore({ name: STORE_NAME, consistency: 'strong' });
    const { blobs } = await store.list({ prefix: 'notes/' });
    const newestBlobs = [...blobs]
      .sort((first, second) => second.key.localeCompare(first.key))
      .slice(0, MAX_STORED_NOTES_SCAN);
    return await Promise.all(newestBlobs.map(({ key }) => store.get(key, { type: 'json' })));
  },

  async write(note: StoredGuestNote) {
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
    windowLimit: 5,
    windowSize: 600,
    aggregateBy: ['ip']
  }
};
