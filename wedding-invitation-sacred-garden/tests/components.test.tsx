import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { GiftSection } from '../src/components/sections/GiftSection';
import { InvitationEntrance } from '../src/components/common/InvitationEntrance';
import { invitation } from '../src/config/invitation';

describe('invitation configuration and optional sections', () => {
  it('loads the central invitation configuration', () => {
    expect(invitation.brideName).toBe('Ahmed');
    expect(invitation.weddingDate).toBe('2026-08-11T16:00:00+03:00');
    expect(invitation.blessing).toBe('﴿ بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ ﴾');
    expect(invitation.music.src).toBe('/assets/audio/divenire.mp3');
    expect(invitation.contact.email).toBe('ahmedelsaify213@gmail.com');
    expect(invitation.schedule).toHaveLength(5);
    expect(invitation.gallery.every((image) => image.src.startsWith('/assets/images/'))).toBe(true);
  });

  it('does not render the optional gift section when disabled', () => {
    const { container } = render(<GiftSection gift={{ ...invitation.gift, enabled: false }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('opens the entrance from a clear user action', async () => {
    const onOpen = vi.fn();
    const user = userEvent.setup();
    render(<InvitationEntrance invitation={invitation} onOpen={onOpen} />);
    await user.click(screen.getByRole('button', { name: /tap to open/i }));
    expect(onOpen).toHaveBeenCalledOnce();
  });
});
