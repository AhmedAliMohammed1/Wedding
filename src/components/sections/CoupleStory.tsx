import type { InvitationConfig } from '../../types/invitation';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { SectionHeading } from '../common/SectionHeading';
import { BotanicalCorner } from '../decorations/BotanicalCorner';

export function CoupleStory({ invitation }: { invitation: InvitationConfig }) {
  return (
    <section className="story-section section-shell" id="story" aria-labelledby="story-heading">
      <SectionHeading
        id="story-heading"
        eyebrow="A glimpse of us"
        title="A love that found its season"
        description="Some stories arrive loudly. Ours grew quietly—through long walks, shared tables, and the kind of laughter that makes any place feel like home."
      />
      <div className="story-composition">
        <figure className="story-main" data-reveal>
          <div className="organic-mask" data-parallax>
            <ImageWithFallback
              src={invitation.images.storyMain}
              alt="Abstract botanical portrait placeholder for the couple"
              width="1200"
              height="1500"
              loading="lazy"
            />
          </div>
          <figcaption>Every path led here.</figcaption>
        </figure>
        <figure className="story-secondary" data-reveal>
          <ImageWithFallback
            src={invitation.images.storySecondary}
            alt="Layered botanical detail placeholder"
            width="900"
            height="1100"
            loading="lazy"
          />
        </figure>
        <blockquote data-reveal>
          <span>“</span>
          To love and to be loved is to feel the sun from both sides.
        </blockquote>
        <BotanicalCorner position="bottom-right" />
      </div>
    </section>
  );
}
