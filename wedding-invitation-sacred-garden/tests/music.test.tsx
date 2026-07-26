import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MusicPlayer } from '../src/components/common/MusicPlayer';

describe('music control', () => {
  it('plays and pauses from the accessible toggle', async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
    const pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
    const user = userEvent.setup();
    render(<MusicPlayer src="/assets/audio/divenire.mp3" title="Divenire" visible />);

    await user.click(screen.getByRole('button', { name: /play divenire/i }));
    expect(play).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: /pause divenire/i })).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: /pause divenire/i }));
    expect(pause).toHaveBeenCalledOnce();
  });
});
