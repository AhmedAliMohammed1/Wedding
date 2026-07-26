import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { calculateCountdown } from '../../lib/countdown';
import { SectionHeading } from '../common/SectionHeading';

interface Props {
  weddingDate: string;
  timezone: string;
}

export function Countdown({ weddingDate, timezone }: Props) {
  const [countdown, setCountdown] = useState(() => calculateCountdown(weddingDate));
  const entries = useMemo(
    () =>
      [
        ['days', countdown.days],
        ['hours', countdown.hours],
        ['minutes', countdown.minutes],
        ['seconds', countdown.seconds]
      ] as const,
    [countdown]
  );

  useEffect(() => {
    setCountdown(calculateCountdown(weddingDate));
    const timer = window.setInterval(() => setCountdown(calculateCountdown(weddingDate)), 1000);
    return () => window.clearInterval(timer);
  }, [weddingDate]);

  return (
    <section className="countdown-section section-shell" id="countdown" aria-labelledby="countdown-heading">
      <SectionHeading id="countdown-heading" eyebrow="Save the date" title="Until our garden celebration" />
      {!countdown.valid ? (
        <p className="countdown-message" role="status">
          The celebration date will be announced soon.
        </p>
      ) : countdown.complete ? (
        <p className="countdown-message celebration-message" role="status">
          Today is the day — let the celebration begin!
        </p>
      ) : (
        <>
          <div className="countdown-grid" aria-live="off">
            {entries.map(([label, value]) => (
              <div className="countdown-cell" key={label}>
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.strong
                    key={value}
                    initial={{ y: -8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 8, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    aria-label={`${value} ${label}`}
                  >
                    {String(value).padStart(2, '0')}
                  </motion.strong>
                </AnimatePresence>
                <span>{label}</span>
              </div>
            ))}
          </div>
          <p className="timezone-note">Times shown for {timezone.replace('_', ' ')}</p>
        </>
      )}
    </section>
  );
}
