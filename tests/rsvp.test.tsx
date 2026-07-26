import { describe, expect, it } from 'vitest';
import { invitation } from '../src/config/invitation';

describe('reservation feature removal', () => {
  it('does not expose RSVP configuration', () => {
    expect('rsvp' in invitation).toBe(false);
  });
});
