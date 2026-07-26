import type { InvitationConfig } from '../../types/invitation';

export function Footer({ invitation }: { invitation: InvitationConfig }) {
  return (
    <footer className="site-footer">
      <p className="footer-monogram">{invitation.initials}</p>
      <p>© {new Date(invitation.weddingDate).getFullYear()} {invitation.brideName} & {invitation.groomName}</p>
      <a href={`mailto:${invitation.contact.email}`}>Contact the couple</a>
      <small>Invitation website credit placeholder</small>
    </footer>
  );
}
