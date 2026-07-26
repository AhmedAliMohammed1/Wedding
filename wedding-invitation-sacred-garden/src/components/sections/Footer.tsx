import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { InvitationConfig } from '../../types/invitation';

export function Footer({ invitation }: { invitation: InvitationConfig }) {
  const [privacyOpen, setPrivacyOpen] = useState(false);

  useEffect(() => {
    if (!privacyOpen) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPrivacyOpen(false);
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [privacyOpen]);

  return (
    <>
      <footer className="site-footer">
        <p className="footer-monogram">{invitation.initials}</p>
        <p>© {new Date(invitation.weddingDate).getFullYear()} {invitation.brideName} & {invitation.groomName}</p>
        <button type="button" onClick={() => setPrivacyOpen(true)}>
          Privacy & RSVP
        </button>
        <small>Invitation website credit placeholder</small>
      </footer>
      {privacyOpen ? (
        <div
          className="privacy-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="privacy-title"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setPrivacyOpen(false);
          }}
        >
          <div>
            <button className="modal-close" type="button" onClick={() => setPrivacyOpen(false)} aria-label="Close privacy note">
              <X aria-hidden="true" />
            </button>
            <p className="eyebrow">Your information</p>
            <h2 id="privacy-title">A simple privacy note</h2>
            <p>
              RSVP information is submitted to the wedding hosts through Netlify Forms. It is used only to plan
              this celebration and respond to guests.
            </p>
            <p>No payment information is collected, and no analytics or unnecessary tracking is enabled by default.</p>
            <p>
              Questions? Contact <a href={`mailto:${invitation.contact.email}`}>{invitation.contact.email}</a>.
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
