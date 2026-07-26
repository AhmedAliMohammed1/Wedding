import type { InvitationConfig } from '../../types/invitation';
import { BotanicalCorner } from '../decorations/BotanicalCorner';
import { FloralDivider } from '../decorations/FloralDivider';
import { Monogram } from '../decorations/Monogram';

export function WelcomeSection({ invitation }: { invitation: InvitationConfig }) {
  return (
    <section className="welcome-section section-shell" id="welcome" aria-labelledby="welcome-title">
      <BotanicalCorner position="top-right" muted />
      <div className="welcome-inner" data-reveal>
        <p className="welcome-blessing" dir="rtl" lang="ar">
          {invitation.blessing}
        </p>
        <Monogram initials={invitation.initials} size="medium" />
        <h2 id="welcome-title">{invitation.introductionHeading}</h2>
        <FloralDivider />
        <p className="welcome-copy">{invitation.introduction}</p>
        <p className="script-signature">With all our love</p>
      </div>
    </section>
  );
}
