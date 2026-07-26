import { ChevronDown, MapPin } from 'lucide-react';
import type { InvitationConfig } from '../../types/invitation';
import { DecorativeFrame } from '../decorations/DecorativeFrame';
import { FloatingPetals } from '../decorations/FloatingPetals';

export function HeroSection({ invitation }: { invitation: InvitationConfig }) {
  return (
    <section className="hero-section" id="invitation" aria-labelledby="hero-title">
      <img
        className="hero-image"
        src={invitation.images.hero}
        alt=""
        width="1920"
        height="1280"
        loading="eager"
        fetchPriority="high"
      />
      <div className="hero-overlay" />
      <FloatingPetals count={10} />
      <DecorativeFrame />
      <div className="hero-content">
        <p className="eyebrow hero-kicker">The wedding of</p>
        <h1 id="hero-title" className="hero-names">
          <span>{invitation.brideName}</span>
          <i>&</i>
          <span>{invitation.groomName}</span>
        </h1>
        <div className="hero-rule" aria-hidden="true" />
        <p className="hero-date">{invitation.displayDate}</p>
        <p className="hero-location">
          <MapPin size={15} strokeWidth={1.5} aria-hidden="true" />
          {invitation.venue.city}, {invitation.venue.countryName}
        </p>
      </div>
      <a className="scroll-cue" href="#welcome" aria-label="Scroll to the welcome message">
        <span>Discover</span>
        <ChevronDown size={18} aria-hidden="true" />
      </a>
    </section>
  );
}
