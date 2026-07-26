import { zodResolver } from '@hookform/resolvers/zod';
import { Check, LoaderCircle, Send, Sprout } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm, type FieldErrors } from 'react-hook-form';
import { createRsvpSchema, type RsvpValues } from '../../lib/rsvpSchema';
import type { InvitationConfig } from '../../types/invitation';
import { SectionHeading } from '../common/SectionHeading';

const fieldOrder: Array<keyof RsvpValues> = [
  'guestName',
  'email',
  'phone',
  'attendance',
  'guestCount',
  'mealPreference',
  'dietaryRestrictions',
  'message',
  'consent'
];

function focusFirstInvalid(errors: FieldErrors<RsvpValues>) {
  const first = fieldOrder.find((field) => errors[field]);
  if (!first) return;
  window.setTimeout(() => {
    document.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  }, 0);
}

export function RSVPForm({ invitation }: { invitation: InvitationConfig }) {
  const schema = createRsvpSchema(invitation.rsvp.maxGuests);
  const [submission, setSubmission] = useState<'idle' | 'success' | 'error'>('idle');
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<RsvpValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    shouldFocusError: true,
    defaultValues: {
      guestName: '',
      email: '',
      phone: '',
      guestCount: 1,
      dietaryRestrictions: '',
      message: '',
      consent: false,
      'bot-field': ''
    }
  });
  const attendance = watch('attendance');

  useEffect(() => {
    if (attendance === 'unable') {
      setValue('guestCount', 0, { shouldValidate: true });
      setValue('mealPreference', undefined, { shouldValidate: true });
    } else if (attendance === 'attending') {
      setValue('guestCount', Math.max(1, watch('guestCount') || 1), { shouldValidate: true });
    }
  }, [attendance, setValue, watch]);

  const onSubmit = async (values: RsvpValues) => {
    if (values['bot-field']) return;
    setSubmission('idle');
    try {
      const isLocal =
        import.meta.env.MODE === 'test' || ['localhost', '127.0.0.1'].includes(window.location.hostname);
      if (isLocal) {
        await new Promise((resolve) => window.setTimeout(resolve, 500));
      } else {
        const body = new URLSearchParams();
        body.set('form-name', 'wedding-rsvp');
        Object.entries(values).forEach(([key, value]) => {
          if (value !== undefined) body.set(key, String(value));
        });
        const response = await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body.toString()
        });
        if (!response.ok) throw new Error('Submission failed');
      }
      setSubmission('success');
    } catch {
      setSubmission('error');
    }
  };

  if (submission === 'success') {
    return (
      <section className="rsvp-section section-shell" id="rsvp" aria-labelledby="rsvp-heading">
        <div className="rsvp-success" role="status" data-reveal>
          <span>
            <Check aria-hidden="true" />
          </span>
          <p className="eyebrow">Reply received</p>
          <h2 id="rsvp-heading">Thank you for letting us know.</h2>
          <p>Your response has been sent to the couple. We’re grateful you took a moment to reply.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="rsvp-section section-shell" id="rsvp" aria-labelledby="rsvp-heading">
      <SectionHeading
        id="rsvp-heading"
        eyebrow="Kindly reply"
        title="Will you join us?"
        description={`Please send your response by ${invitation.rsvp.deadline}. Each reply helps us prepare your place at the table.`}
      />
      <form
        className="rsvp-form"
        name="wedding-rsvp"
        method="POST"
        data-netlify="true"
        data-netlify-honeypot="bot-field"
        noValidate
        onSubmit={(event) => void handleSubmit(onSubmit, focusFirstInvalid)(event)}
        data-reveal
      >
        <input type="hidden" name="form-name" value="wedding-rsvp" />
        <div className="honeypot" aria-hidden="true">
          <label htmlFor="bot-field">
            Do not fill this out
            <input id="bot-field" tabIndex={-1} autoComplete="off" {...register('bot-field')} />
          </label>
        </div>
        <div className="form-grid">
          <div className="form-field form-field-wide">
            <label htmlFor="guestName">Guest name</label>
            <input
              id="guestName"
              type="text"
              autoComplete="name"
              aria-invalid={Boolean(errors.guestName)}
              aria-describedby={errors.guestName ? 'guestName-error' : undefined}
              {...register('guestName')}
            />
            {errors.guestName ? <p id="guestName-error" className="field-error">{errors.guestName.message}</p> : null}
          </div>
          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'email-error' : undefined}
              {...register('email')}
            />
            {errors.email ? <p id="email-error" className="field-error">{errors.email.message}</p> : null}
          </div>
          <div className="form-field">
            <label htmlFor="phone">Phone number</label>
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? 'phone-error' : undefined}
              {...register('phone')}
            />
            {errors.phone ? <p id="phone-error" className="field-error">{errors.phone.message}</p> : null}
          </div>
        </div>

        <fieldset className="choice-fieldset">
          <legend>Will you be attending?</legend>
          <div className="choice-grid">
            <label>
              <input type="radio" value="attending" {...register('attendance')} />
              <span>
                <Sprout size={19} aria-hidden="true" />
                Joyfully attending
              </span>
            </label>
            <label>
              <input type="radio" value="unable" {...register('attendance')} />
              <span>Regretfully unable to attend</span>
            </label>
          </div>
          {errors.attendance ? <p className="field-error">{errors.attendance.message}</p> : null}
        </fieldset>

        {attendance === 'attending' ? (
          <div className="conditional-fields">
            <div className="form-field">
              <label htmlFor="guestCount">Number of guests</label>
              <select
                id="guestCount"
                aria-invalid={Boolean(errors.guestCount)}
                {...register('guestCount', { valueAsNumber: true })}
              >
                {Array.from({ length: invitation.rsvp.maxGuests }, (_, index) => index + 1).map((count) => (
                  <option key={count} value={count}>
                    {count}
                  </option>
                ))}
              </select>
              {errors.guestCount ? <p className="field-error">{errors.guestCount.message}</p> : null}
            </div>
            <fieldset className="choice-fieldset meal-fieldset">
              <legend>Meal preference</legend>
              <div className="meal-grid">
                {[
                  ['standard', 'Standard'],
                  ['vegetarian', 'Vegetarian'],
                  ['vegan', 'Vegan'],
                  ['other', 'Other']
                ].map(([value, label]) => (
                  <label key={value}>
                    <input type="radio" value={value} {...register('mealPreference')} />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
              {errors.mealPreference ? <p className="field-error">{errors.mealPreference.message}</p> : null}
            </fieldset>
          </div>
        ) : null}

        <div className="form-field">
          <label htmlFor="dietaryRestrictions">Dietary restrictions <small>Optional</small></label>
          <textarea id="dietaryRestrictions" rows={3} {...register('dietaryRestrictions')} />
          {errors.dietaryRestrictions ? (
            <p className="field-error">{errors.dietaryRestrictions.message}</p>
          ) : null}
        </div>
        <div className="form-field">
          <label htmlFor="message">A message for the couple <small>Optional</small></label>
          <textarea id="message" rows={5} {...register('message')} />
          {errors.message ? <p className="field-error">{errors.message.message}</p> : null}
        </div>
        <label className="consent-field">
          <input type="checkbox" {...register('consent')} />
          <span>
            I agree that these details may be shared with the wedding hosts for planning this celebration.
          </span>
        </label>
        {errors.consent ? <p className="field-error consent-error">{errors.consent.message}</p> : null}

        <button className="button button-dark submit-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <LoaderCircle className="spin" aria-hidden="true" /> Sending response
            </>
          ) : (
            <>
              Send RSVP <Send size={16} aria-hidden="true" />
            </>
          )}
        </button>
        <p className="form-note">In local preview, a successful submission is simulated. Netlify processes this form after deployment.</p>
        <div className="submission-message" aria-live="polite">
          {submission === 'error' ? (
            <p role="alert">
              We couldn’t send your reply. Please try again, or contact the couple at{' '}
              <a href={`mailto:${invitation.contact.email}`}>{invitation.contact.email}</a>.
            </p>
          ) : null}
        </div>
      </form>
    </section>
  );
}
