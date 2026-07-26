import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { RSVPForm } from '../src/components/forms/RSVPForm';
import { invitation } from '../src/config/invitation';
import { createRsvpSchema } from '../src/lib/rsvpSchema';

describe('RSVP form', () => {
  it('validates required details and consent', async () => {
    const user = userEvent.setup();
    render(<RSVPForm invitation={invitation} />);

    await user.click(screen.getByRole('button', { name: /send rsvp/i }));

    expect(await screen.findByText(/enter your full name/i)).toBeInTheDocument();
    expect(screen.getByText(/valid email address/i)).toBeInTheDocument();
    expect(screen.getByText(/let us know if you can attend/i)).toBeInTheDocument();
    expect(screen.getByText(/confirm that we may use these details/i)).toBeInTheDocument();
  });

  it('shows guest count and meal choices only for attending guests', async () => {
    const user = userEvent.setup();
    render(<RSVPForm invitation={invitation} />);

    await user.click(screen.getByRole('radio', { name: /joyfully attending/i }));
    expect(screen.getByLabelText(/number of guests/i)).toBeInTheDocument();
    expect(screen.getByText(/meal preference/i)).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: /regretfully unable/i }));
    expect(screen.queryByLabelText(/number of guests/i)).not.toBeInTheDocument();
  });

  it('enforces the configured guest limit', () => {
    const result = createRsvpSchema(3).safeParse({
      guestName: 'Sam Guest',
      email: 'sam@example.com',
      phone: '+49 123 4567',
      attendance: 'attending',
      guestCount: 4,
      mealPreference: 'standard',
      consent: true,
      'bot-field': ''
    });
    expect(result.success).toBe(false);
  });

  it('shows a successful local submission state', async () => {
    const user = userEvent.setup();
    render(<RSVPForm invitation={invitation} />);

    await user.type(screen.getByLabelText(/guest name/i), 'Sam Guest');
    await user.type(screen.getByLabelText(/^email$/i), 'sam@example.com');
    await user.type(screen.getByLabelText(/phone number/i), '+49 123 456789');
    await user.click(screen.getByRole('radio', { name: /joyfully attending/i }));
    await user.click(screen.getByRole('radio', { name: /^vegetarian$/i }));
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /send rsvp/i }));

    expect(await screen.findByText(/thank you for letting us know/i)).toBeInTheDocument();
  });
});
