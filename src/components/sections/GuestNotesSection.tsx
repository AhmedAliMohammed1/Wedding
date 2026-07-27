import { Eye, EyeOff, Heart, LoaderCircle, Send } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { readNotesApiResponse } from '../../lib/notesApi';
import {
  isGuestNote,
  type GuestNote,
  type GuestNoteMutationResponse,
  type GuestNotesResponse
} from '../../types/guestNote';
import { SectionHeading } from '../common/SectionHeading';
import { BotanicalCorner } from '../decorations/BotanicalCorner';

const MAX_MESSAGE_LENGTH = 500;

const formatNoteDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
};

interface Props {
  coupleNames: string;
  title: string;
  description: string;
}

export function GuestNotesSection({ coupleNames, title, description }: Props) {
  const [identity, setIdentity] = useState<'named' | 'anonymous'>('named');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesLoaded, setNotesLoaded] = useState(false);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState('');
  const [notes, setNotes] = useState<GuestNote[]>([]);

  const loadNotes = async () => {
    setNotesLoading(true);
    setNotesError('');

    try {
      const response = await fetch('/api/notes', {
        headers: { Accept: 'application/json' }
      });
      const data = await readNotesApiResponse<GuestNotesResponse>(
        response,
        'The notes could not be loaded.'
      );

      if (!Array.isArray(data.notes) || !data.notes.every(isGuestNote)) {
        throw new Error('The guest-notes service returned an invalid response. Please try again.');
      }

      setNotes(data.notes);
      setNotesLoaded(true);
    } catch (error) {
      setNotesError(error instanceof Error ? error.message : 'The notes could not be loaded.');
    } finally {
      setNotesLoading(false);
    }
  };

  const toggleNotes = () => {
    if (notesOpen) {
      setNotesOpen(false);
      return;
    }

    setNotesOpen(true);
    if (!notesLoaded && !notesLoading) {
      void loadNotes();
    }
  };

  const submitNote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitMessage('');
    setSubmitError('');

    const trimmedName = name.trim();
    const trimmedMessage = message.trim();

    if (identity === 'named' && trimmedName.length < 2) {
      setSubmitError('Please enter your name or choose “Post anonymously”.');
      return;
    }

    if (trimmedMessage.length < 2) {
      setSubmitError('Please write a short note before sending.');
      return;
    }

    const formData = new FormData(event.currentTarget);
    const websiteValue = formData.get('website');
    const website = typeof websiteValue === 'string' ? websiteValue : '';

    setSubmitting(true);
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          anonymous: identity === 'anonymous',
          name: identity === 'anonymous' ? '' : trimmedName,
          message: trimmedMessage,
          website
        })
      });
      const data = await readNotesApiResponse<GuestNoteMutationResponse>(
        response,
        'Your note could not be sent.'
      );

      if (!isGuestNote(data.note)) {
        throw new Error('The guest-notes service did not confirm your note. Please try again.');
      }

      setMessage('');
      setSubmitMessage(
        data.note.anonymous
          ? 'Your anonymous note has been added with love.'
          : `Thank you, ${data.note.author}. Your note has been added with love.`
      );

      if (notesOpen) {
        setNotes((current) => [data.note as GuestNote, ...current.filter((note) => note.id !== data.note?.id)]);
        setNotesLoaded(true);
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Your note could not be sent.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="notes-section" id="guest-notes" aria-labelledby="guest-notes-heading">
      <BotanicalCorner position="top-left" muted />
      <BotanicalCorner position="bottom-right" muted />
      <div className="section-shell">
        <SectionHeading
          id="guest-notes-heading"
          eyebrow="A gentle note"
          title={title}
          description={`${description} This wall is for ${coupleNames}.`}
          light
        />

        <div className="note-compose-card" data-reveal>
          <span className="note-heart" aria-hidden="true">
            <Heart />
          </span>
          <div className="note-compose-heading">
            <p className="eyebrow">From your heart</p>
            <h3>Write your note</h3>
            <p>Choose whether to sign your name or share it anonymously.</p>
          </div>

          <form className="guest-note-form" onSubmit={submitNote}>
            <fieldset className="note-identity">
              <legend>How should your note appear?</legend>
              <div className="note-identity-options">
                <label>
                  <input
                    type="radio"
                    name="identity"
                    value="named"
                    checked={identity === 'named'}
                    onChange={() => setIdentity('named')}
                  />
                  <span>
                    <strong>With my name</strong>
                    <small>Your name appears beside the note.</small>
                  </span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="identity"
                    value="anonymous"
                    checked={identity === 'anonymous'}
                    onChange={() => setIdentity('anonymous')}
                  />
                  <span>
                    <strong>Post anonymously</strong>
                    <small>Your note appears as “Anonymous”.</small>
                  </span>
                </label>
              </div>
            </fieldset>

            {identity === 'named' ? (
              <label className="note-input-field">
                <span>Your name</span>
                <input
                  type="text"
                  name="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={60}
                  autoComplete="name"
                  placeholder="Your name"
                  required
                />
              </label>
            ) : null}

            <label className="note-input-field note-message-field">
              <span>Your note</span>
              <textarea
                name="message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                maxLength={MAX_MESSAGE_LENGTH}
                rows={5}
                placeholder="Write a wish, memory, or dua…"
                required
              />
            </label>

            <label className="note-honeypot" aria-hidden="true">
              Leave this field empty
              <input name="website" type="text" tabIndex={-1} autoComplete="off" />
            </label>

            <div className="note-submit-row">
              <span className="note-character-count" aria-hidden="true">
                {message.length} / {MAX_MESSAGE_LENGTH}
              </span>
              <button className="button button-dark" type="submit" disabled={submitting}>
                {submitting ? <LoaderCircle className="note-spinner" aria-hidden="true" /> : <Send aria-hidden="true" />}
                {submitting ? 'Sending…' : 'Send note'}
              </button>
            </div>

            <div className="note-form-feedback" aria-live="polite" aria-atomic="true">
              {submitError ? <p className="note-error">{submitError}</p> : null}
              {submitMessage ? <p className="note-success">{submitMessage}</p> : null}
            </div>
          </form>
        </div>

        <div className="notes-disclosure">
          <button
            className="button button-light"
            type="button"
            aria-expanded={notesOpen}
            aria-controls="guest-notes-wall"
            onClick={toggleNotes}
          >
            {notesOpen ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
            {notesOpen ? 'Hide notes' : 'Show all notes'}
          </button>
        </div>

        {notesOpen ? (
          <div className="notes-wall" id="guest-notes-wall" aria-live="polite">
            {notesLoading ? (
              <p className="notes-wall-state">
                <LoaderCircle className="note-spinner" aria-hidden="true" /> Gathering the notes…
              </p>
            ) : null}

            {!notesLoading && notesError ? (
              <div className="notes-wall-state" role="alert">
                <p>{notesError}</p>
                <button className="button button-light" type="button" onClick={() => void loadNotes()}>
                  Try again
                </button>
              </div>
            ) : null}

            {!notesLoading && !notesError && notesLoaded && notes.length === 0 ? (
              <p className="notes-wall-state">No notes yet. Yours can be the first.</p>
            ) : null}

            {!notesLoading && !notesError && notes.length > 0 ? (
              <ul className="guest-notes-list">
                {notes.map((note) => (
                  <li key={note.id}>
                    <article className="guest-note-card">
                      <Heart aria-hidden="true" />
                      <blockquote>{note.message}</blockquote>
                      <footer>
                        <strong>{note.author}</strong>
                        {formatNoteDate(note.createdAt) ? (
                          <time dateTime={note.createdAt}>{formatNoteDate(note.createdAt)}</time>
                        ) : null}
                      </footer>
                    </article>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
