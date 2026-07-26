import { CalendarDays, ExternalLink, MapPin } from 'lucide-react';
import type { InvitationConfig } from '../../types/invitation';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { SectionHeading } from '../common/SectionHeading';
import { BotanicalCorner } from '../decorations/BotanicalCorner';

const isValidHttpUrl = (value: string) => {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
};

export function VenueSection({ invitation }: { invitation: InvitationConfig }) {
  const mapValid = isValidHttpUrl(invitation.venue.mapEmbedUrl);
  return (
    <section className="venue-section" id="venue" aria-labelledby="venue-heading">
      <div className="section-shell">
        <SectionHeading id="venue-heading" eyebrow="Meet us in the garden" title={invitation.venue.name} />
        <div className="venue-grid">
          <div className="venue-image-wrap" data-reveal>
            <ImageWithFallback
              src={invitation.venue.image}
              alt="Atmospheric botanical placeholder for the wedding venue"
              width="1400"
              height="1000"
              loading="lazy"
            />
            <BotanicalCorner position="bottom-left" />
          </div>
          <div className="venue-details" data-reveal>
            <p>
              <MapPin aria-hidden="true" />
              <span>{invitation.venue.address}</span>
            </p>
            <p>
              <CalendarDays aria-hidden="true" />
              <span>
                {invitation.displayDate}
                <br />
                Guest arrival from {invitation.schedule[0]?.time ?? '4:00 PM'}
              </span>
            </p>
            {isValidHttpUrl(invitation.venue.directionsUrl) ? (
              <a
                className="button button-dark"
                href={invitation.venue.directionsUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open directions <ExternalLink size={16} aria-hidden="true" />
              </a>
            ) : null}
          </div>
        </div>
        <div className="map-frame" data-reveal>
          {mapValid ? (
            <iframe
              src={invitation.venue.mapEmbedUrl}
              title={`Map showing ${invitation.venue.name}`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          ) : (
            <div className="map-fallback" role="status">
              The map is unavailable. Please use the address above.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
