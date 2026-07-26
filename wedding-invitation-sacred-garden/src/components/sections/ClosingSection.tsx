import { ArrowUp } from 'lucide-react';
import type { InvitationConfig } from '../../types/invitation';
import { FloralDivider } from '../decorations/FloralDivider';
import { FloatingPetals } from '../decorations/FloatingPetals';
import { Monogram } from '../decorations/Monogram';

export function ClosingSection({ invitation }: { invitation: InvitationConfig }) {
  return (
    <section className="closing-section" id="closing" aria-labelledby="closing-heading">
      <div className="closing-backdrop" aria-hidden="true" />
      <FloatingPetals count={7} />
      <div className="closing-ornament">
        <p className="eyebrow">Until then</p>
        <Monogram initials={invitation.initials} size="large" light />
        <h2 id="closing-heading">{invitation.closingMessage}</h2>
        <FloralDivider />
        <p className="closing-names">
          {invitation.brideName} <span>&</span> {invitation.groomName}
        </p>
        <p>{invitation.shortDate}</p>
        <a className="back-to-top" href="#invitation">
          <ArrowUp size={16} aria-hidden="true" /> Back to top
        </a>
      </div>
    </section>
  );
}
