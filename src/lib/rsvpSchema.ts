import { z } from 'zod';

export const createRsvpSchema = (maxGuests: number) =>
  z
    .object({
      guestName: z.string().trim().min(2, 'Please enter your full name.'),
      email: z.string().trim().email('Please enter a valid email address.'),
      phone: z.string().trim().min(7, 'Please enter a phone number.'),
      attendance: z.preprocess(
        (value) => value || undefined,
        z.enum(['attending', 'unable'], {
          required_error: 'Please let us know if you can attend.'
        })
      ),
      guestCount: z.number().int().min(0).max(maxGuests, `The maximum party size is ${maxGuests}.`),
      mealPreference: z.enum(['standard', 'vegetarian', 'vegan', 'other']).optional(),
      dietaryRestrictions: z.string().trim().max(500, 'Please keep this under 500 characters.').optional(),
      message: z.string().trim().max(1000, 'Please keep this under 1,000 characters.').optional(),
      consent: z
        .boolean()
        .refine((value) => value, 'Please confirm that we may use these details for wedding planning.'),
      'bot-field': z.string().max(0).optional()
    })
    .superRefine((data, context) => {
      if (data.attendance === 'attending' && data.guestCount < 1) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['guestCount'],
          message: 'Please select at least one guest.'
        });
      }
      if (data.attendance === 'attending' && !data.mealPreference) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['mealPreference'],
          message: 'Please choose a meal preference.'
        });
      }
    });

export type RsvpValues = z.infer<ReturnType<typeof createRsvpSchema>>;
