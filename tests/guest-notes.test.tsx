import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GuestNotesSection } from '../src/components/sections/GuestNotesSection';

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });

const guestNotesProps = {
  coupleNames: 'Ahmed & Nada',
  title: 'Leave a little love',
  description: 'Share a wish, a dua, or a favourite memory.'
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('guest notes section', () => {
  it('lets a visitor choose whether their name is shown', async () => {
    const user = userEvent.setup();
    render(<GuestNotesSection {...guestNotesProps} />);

    expect(screen.getByRole('textbox', { name: /your name/i })).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: /post anonymously/i }));

    expect(screen.queryByRole('textbox', { name: /your name/i })).not.toBeInTheDocument();
    expect(screen.getByText(/your note appears as “anonymous”/i)).toBeInTheDocument();
  });

  it('submits a signed note with the visitor name', async () => {
    const note = {
      id: 'note-1',
      author: 'Layla',
      anonymous: false,
      message: 'May your life together be full of baraka.',
      createdAt: '2026-07-27T10:00:00.000Z'
    };
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ note }, 201));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<GuestNotesSection {...guestNotesProps} />);

    await user.type(screen.getByRole('textbox', { name: /your name/i }), 'Layla');
    await user.type(screen.getByRole('textbox', { name: /your note/i }), note.message);
    await user.click(screen.getByRole('button', { name: /send note/i }));

    expect(await screen.findByText(/thank you, layla/i)).toBeInTheDocument();
    const request = fetchMock.mock.calls[0];
    expect(request?.[0]).toBe('/api/notes');
    expect(request?.[1]?.method).toBe('POST');
    const requestBody = request?.[1]?.body;
    expect(typeof requestBody).toBe('string');
    if (typeof requestBody !== 'string') throw new Error('Expected a JSON request body.');
    expect(JSON.parse(requestBody)).toMatchObject({
      anonymous: false,
      name: 'Layla',
      message: note.message
    });
  });

  it('submits an anonymous note without sending a name', async () => {
    const note = {
      id: 'note-2',
      author: 'Anonymous',
      anonymous: true,
      message: 'Wishing you endless joy.',
      createdAt: '2026-07-27T11:00:00.000Z'
    };
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ note }, 201));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<GuestNotesSection {...guestNotesProps} />);

    await user.click(screen.getByRole('radio', { name: /post anonymously/i }));
    await user.type(screen.getByRole('textbox', { name: /your note/i }), note.message);
    await user.click(screen.getByRole('button', { name: /send note/i }));

    expect(await screen.findByText(/anonymous note has been added/i)).toBeInTheDocument();
    const request = fetchMock.mock.calls[0];
    const requestBody = request?.[1]?.body;
    expect(typeof requestBody).toBe('string');
    if (typeof requestBody !== 'string') throw new Error('Expected a JSON request body.');
    expect(JSON.parse(requestBody)).toMatchObject({
      anonymous: true,
      name: '',
      message: note.message
    });
  });

  it('shows a useful deployment message instead of [object Object]', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse({ error: { message: 'Not Found' } }, 404));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<GuestNotesSection {...guestNotesProps} />);

    await user.type(screen.getByRole('textbox', { name: /your name/i }), 'Layla');
    await user.type(screen.getByRole('textbox', { name: /your note/i }), 'A beautiful wish.');
    await user.click(screen.getByRole('button', { name: /send note/i }));

    expect(await screen.findByText(/service is not connected on this deployment/i)).toBeInTheDocument();
    expect(screen.queryByText('[object Object]')).not.toBeInTheDocument();
  });

  it('detects a static SPA response when the Netlify function was not deployed', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response('<!doctype html><html><body>The invitation</body></html>', {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      })
    );
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<GuestNotesSection {...guestNotesProps} />);

    await user.click(screen.getByRole('radio', { name: /post anonymously/i }));
    await user.type(screen.getByRole('textbox', { name: /your note/i }), 'A beautiful wish.');
    await user.click(screen.getByRole('button', { name: /send note/i }));

    expect(await screen.findByText(/redeploy the complete Netlify project/i)).toBeInTheDocument();
  });

  it('loads previous notes only when the visitor asks to see them', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({
        notes: [
          {
            id: 'note-3',
            author: 'Omar',
            anonymous: false,
            message: 'A lifetime of laughter and peace.',
            createdAt: '2026-07-27T12:00:00.000Z'
          },
          {
            id: 'note-4',
            author: 'Anonymous',
            anonymous: true,
            message: 'May every year be sweeter than the last.',
            createdAt: '2026-07-27T11:00:00.000Z'
          }
        ]
      })
    );
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<GuestNotesSection {...guestNotesProps} />);

    expect(fetchMock).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: /show all notes/i }));

    expect(await screen.findByText('A lifetime of laughter and peace.')).toBeInTheDocument();
    expect(screen.getByText('May every year be sweeter than the last.')).toBeInTheDocument();
    expect(screen.getByText('Omar')).toBeInTheDocument();
    expect(screen.getByText('Anonymous')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/notes', {
      headers: { Accept: 'application/json' }
    });
  });
});
