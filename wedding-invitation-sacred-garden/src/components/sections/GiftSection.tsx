import { Gift, Heart } from 'lucide-react';
import type { InvitationConfig } from '../../types/invitation';
import { SectionHeading } from '../common/SectionHeading';
import { BotanicalCorner } from '../decorations/BotanicalCorner';

export function GiftSection({ gift }: { gift: InvitationConfig['gift'] }) {
  if (!gift.enabled) return null;

  return (
    <section className="gift-section" id="gifts" aria-labelledby="gift-heading">
      <BotanicalCorner position="top-left" muted />
      <BotanicalCorner position="bottom-right" muted />
      <div className="section-shell">
        <SectionHeading id="gift-heading" eyebrow="A gentle note" title={gift.title} light />
        <div className="gift-content" data-reveal>
          <span className="gift-icon" aria-hidden="true">
            <Gift />
            <Heart />
          </span>
          <p>{gift.message}</p>
          <small>{gift.preference}</small>
          {gift.buttonLabel && gift.buttonUrl ? (
            <a className="button button-light" href={gift.buttonUrl}>
              {gift.buttonLabel}
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}
