import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GuestNotesSection } from '../src/components/sections/GuestNotesSection';

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });

const storageErrorResponse = (message: string, status = 503) =>
  new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-Guest-Notes-Error': 'storage'
    }
  });

const guestNotesProps = {
  coupleNames: 'Ahmed & Nada',
  title: 'Leave a little love',
  description: 'Share a wish, a dua, or a favourite memory.'
};

const pagination = (
  overrides: Partial<{
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  }> = {}
) => ({
  page: 1,
  pageSize: 6,
  total: 0,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false,
  ...overrides
});

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

  it('shows the Vercel storage recovery instruction returned by the API', async () => {
    const recoveryMessage =
      'Vercel cannot access the connected Blob store. Reconnect it, confirm BLOB_STORE_ID is enabled for Production (or BLOB_READ_WRITE_TOKEN for an older connection), and redeploy.';
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(storageErrorResponse(recoveryMessage));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<GuestNotesSection {...guestNotesProps} />);

    await user.click(screen.getByRole('radio', { name: /post anonymously/i }));
    await user.type(screen.getByRole('textbox', { name: /your note/i }), 'A beautiful wish.');
    await user.click(screen.getByRole('button', { name: /send note/i }));

    expect(await screen.findByText(recoveryMessage)).toBeInTheDocument();
    expect(screen.queryByText(/temporarily unavailable/i)).not.toBeInTheDocument();
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

    expect(await screen.findByText(/deploy the complete project with its \/api\/notes server function/i)).toBeInTheDocument();
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
        ],
        pagination: pagination({ total: 2 })
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
    expect(fetchMock).toHaveBeenCalledWith('/api/notes?page=1&pageSize=6', {
      headers: { Accept: 'application/json' }
    });
  });

  it('blocks script and injection text before it reaches the API', async () => {
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<GuestNotesSection {...guestNotesProps} />);

    await user.click(screen.getByRole('radio', { name: /post anonymously/i }));
    await user.type(
      screen.getByRole('textbox', { name: /your note/i }),
      "<script>alert('xss')</script>"
    );
    await user.click(screen.getByRole('button', { name: /send note/i }));

    expect(await screen.findByText(/plain-text note without html/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('collapses long notes and reveals the full text on request', async () => {
    const longMessage = Array.from(
      { length: 8 },
      (_, index) => `Memory ${index + 1} brings another beautiful reason to celebrate.`
    ).join(' ');
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({
        notes: [
          {
            id: 'long-note',
            author: 'Mariam',
            anonymous: false,
            message: longMessage,
            createdAt: '2026-07-28T12:00:00.000Z'
          }
        ],
        pagination: pagination({ total: 1 })
      })
    );
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<GuestNotesSection {...guestNotesProps} />);

    await user.click(screen.getByRole('button', { name: /show all notes/i }));
    expect(await screen.findByRole('button', { name: /show more/i })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    expect(screen.queryByText(longMessage)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /show more/i }));
    expect(screen.getByText(longMessage)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /show less/i })).toHaveAttribute(
      'aria-expanded',
      'true'
    );

    await user.click(screen.getByRole('button', { name: /show less/i }));
    expect(screen.queryByText(longMessage)).not.toBeInTheDocument();
  });

  it('loads notes one bounded page at a time', async () => {
    const firstPageNotes = Array.from({ length: 6 }, (_, index) => ({
      id: `page-one-${index}`,
      author: `Guest ${index + 1}`,
      anonymous: false,
      message: `First page wish ${index + 1}.`,
      createdAt: `2026-07-28T1${index}:00:00.000Z`
    }));
    const secondPageNotes = [
      {
        id: 'page-two-1',
        author: 'Guest 7',
        anonymous: false,
        message: 'A wish from the second page.',
        createdAt: '2026-07-28T05:00:00.000Z'
      },
      {
        id: 'page-two-2',
        author: 'Guest 8',
        anonymous: false,
        message: 'Another wish from the second page.',
        createdAt: '2026-07-28T04:00:00.000Z'
      }
    ];
    const fetchMock = vi.fn<typeof fetch>().mockImplementation((input) => {
      const requestedUrl =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.href
            : input.url;
      const pageTwo = requestedUrl.includes('page=2');
      return Promise.resolve(
        jsonResponse({
          notes: pageTwo ? secondPageNotes : firstPageNotes,
          pagination: pageTwo
            ? pagination({
                page: 2,
                total: 8,
                totalPages: 2,
                hasPreviousPage: true
              })
            : pagination({ total: 8, totalPages: 2, hasNextPage: true })
        })
      );
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<GuestNotesSection {...guestNotesProps} />);

    await user.click(screen.getByRole('button', { name: /show all notes/i }));
    expect(await screen.findByText('First page wish 1.')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /guest notes pages/i })).toHaveTextContent(
      /page\s*1\s*of\s*2/i
    );

    await user.click(screen.getByRole('button', { name: /next notes page/i }));
    expect(await screen.findByText('A wish from the second page.')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /guest notes pages/i })).toHaveTextContent(
      /page\s*2\s*of\s*2/i
    );
    expect(fetchMock).toHaveBeenCalledWith('/api/notes?page=2&pageSize=6', {
      headers: { Accept: 'application/json' }
    });
  });
});
