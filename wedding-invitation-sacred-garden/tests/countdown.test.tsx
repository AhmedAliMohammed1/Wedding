import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Countdown } from '../src/components/sections/Countdown';
import { calculateCountdown } from '../src/lib/countdown';

describe('countdown', () => {
  it('formats the remaining time into days, hours, minutes, and seconds', () => {
    const now = new Date('2026-08-09T14:58:55+03:00');
    expect(calculateCountdown('2026-08-11T16:00:00+03:00', now)).toEqual({
      days: 2,
      hours: 1,
      minutes: 1,
      seconds: 5,
      complete: false,
      valid: true
    });
  });

  it('reports a completed celebration after the wedding date', () => {
    const result = calculateCountdown(
      '2026-08-11T16:00:00+03:00',
      new Date('2026-08-12T10:00:00+03:00')
    );
    expect(result.complete).toBe(true);
    expect(result.days).toBe(0);
  });

  it('shows a graceful message for invalid date configuration', () => {
    render(<Countdown weddingDate="not-a-date" timezone="Africa/Cairo" />);
    expect(screen.getByText(/date will be announced/i)).toBeInTheDocument();
  });
});
