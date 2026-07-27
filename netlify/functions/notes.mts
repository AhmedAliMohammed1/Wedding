import { getStore } from '@netlify/blobs';
import type { Config, Context } from '@netlify/functions';
import type { GuestNote } from '../../src/types/guestNote';

const STORE_NAME = 'wedding-guest-notes';
const MAX_NAME_LENGTH = 60;
const MAX_MESSAGE_LENGTH = 500;
const MAX_BODY_LENGTH = 4_000;

const jsonResponse = (data: unknown, status = 200) =>
  Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    }
  });

const normalizeName = (value: unknown) =>
  typeof value === 'string'
    ? value
        .replace(/[\u0000-\u001f\u007f]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    : '';

const normalizeMessage = (value: unknown) =>
  typeof value === 'string'
    ? value
        .replace(/\r\n?/g, '\n')
        .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
    : '';

const isGuestNote = (value: unknown): value is GuestNote => {
  if (!value || typeof value !== 'object') return false;
  const note = value as Partial<GuestNote>;
  return (
    typeof note.id === 'string' &&
    typeof note.author === 'string' &&
    typeof note.anonymous === 'boolean' &&
    typeof note.message === 'string' &&
    typeof note.createdAt === 'string'
  );
};

const readNotes = async () => {
  const store = getStore({ name: STORE_NAME, consistency: 'strong' });
  const { blobs } = await store.list({ prefix: 'notes/' });
  const storedNotes = await Promise.all(
    blobs.map(async ({ key }) => {
      const note = await store.get(key, { type: 'json' });
      return isGuestNote(note) ? note : null;
    })
  );

  return storedNotes
    .filter((note): note is GuestNote => note !== null)
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

  const createdAt = new Date().toISOString();
  const id = crypto.randomUUID();
  const note: GuestNote = {
    id,
    author: anonymous ? 'Anonymous' : name,
    anonymous,
    message,
    createdAt
  };
  const key = `notes/${Date.now().toString().padStart(13, '0')}-${id}.json`;
  const store = getStore({ name: STORE_NAME, consistency: 'strong' });
  await store.setJSON(key, note);

  return jsonResponse({ note }, 201);
};

export default async (request: Request, _context: Context) => {
  try {
    if (request.method === 'GET') {
      return jsonResponse({ notes: await readNotes() });
    }

    if (request.method === 'POST') {
      return await createNote(request);
    }

    return new Response(null, {
      status: 405,
      headers: {
        Allow: 'GET, POST',
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error('Guest notes function failed', error);
    return jsonResponse({ error: 'The notes are temporarily unavailable. Please try again.' }, 500);
  }
};

export const config: Config = {
  path: '/api/notes',
  rateLimit: {
    windowLimit: 30,
    windowSize: 60,
    aggregateBy: ['ip']
  }
};
