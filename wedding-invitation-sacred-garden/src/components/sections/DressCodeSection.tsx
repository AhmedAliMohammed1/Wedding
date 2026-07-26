import { Shirt, Sparkles } from 'lucide-react';
import type { InvitationConfig } from '../../types/invitation';
import { SectionHeading } from '../common/SectionHeading';

export function DressCodeSection({ invitation }: { invitation: InvitationConfig }) {
  return (
    <section className="dress-section section-shell" id="dress-code" aria-labelledby="dress-heading">
      <SectionHeading
        id="dress-heading"
        eyebrow="What to wear"
        title={invitation.dressCode.title}
        description={invitation.dressCode.description}
      />
      <div className="dress-card" data-reveal>
        <div className="dress-icons" aria-hidden="true">
          <Shirt strokeWidth={1.2} />
          <Sparkles strokeWidth={1.2} />
        </div>
        <p>{invitation.dressCode.guidance}</p>
        <ul className="swatch-list" aria-label="Suggested dress code colours">
          {invitation.dressCode.colors.map((color) => (
            <li key={color.hex}>
              <span style={{ backgroundColor: color.hex }} aria-hidden="true" />
              <small>{color.name}</small>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
