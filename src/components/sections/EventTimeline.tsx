import {
  CakeSlice,
  Clock3,
  Music,
  Sparkles,
  Wine,
  type LucideIcon
} from 'lucide-react';
import type { InvitationConfig, ScheduleIcon } from '../../types/invitation';
import { SectionHeading } from '../common/SectionHeading';
import { MosqueIcon } from '../icons/MosqueIcon';

const iconMap: Record<ScheduleIcon, LucideIcon> = {
  arrival: Sparkles,
  ceremony: MosqueIcon,
  drinks: Wine,
  snacks: CakeSlice,
  celebration: Music
};

export function EventTimeline({ invitation }: { invitation: InvitationConfig }) {
  return (
    <section className="timeline-section section-shell" id="schedule" aria-labelledby="timeline-heading">
      <SectionHeading
        id="timeline-heading"
        eyebrow="The order of the day"
        title="A celebration in chapters"
        description="Settle in, raise a glass, and stay as long as the music keeps you moving."
      />
      {invitation.schedule.length === 0 ? (
        <p className="empty-state">The day’s schedule will be shared soon.</p>
      ) : (
        <ol className="event-timeline">
          <span className="timeline-track" aria-hidden="true">
            <span className="timeline-progress" />
          </span>
          {invitation.schedule.map((event, index) => {
            const Icon = iconMap[event.icon] ?? Clock3;
            return (
              <li key={`${event.time}-${event.title}`} className={index % 2 === 0 ? 'timeline-left' : 'timeline-right'}>
                <div className="timeline-icon" aria-hidden="true">
                  <Icon size={20} strokeWidth={1.4} />
                </div>
                <article data-reveal>
                  <time>{event.time}</time>
                  <h3>{event.title}</h3>
                  <p>{event.description}</p>
                </article>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
