import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Music2, Pause, Play, VolumeX } from 'lucide-react';
import { sessionKeys, writeSessionBoolean } from '../../lib/session';

export interface MusicPlayerHandle {
  start: () => Promise<void>;
}

interface Props {
  src: string;
  title: string;
  visible: boolean;
}

export const MusicPlayer = forwardRef<MusicPlayerHandle, Props>(function MusicPlayer(
  { src, title, visible },
  forwardedRef
) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [available, setAvailable] = useState(true);

  const start = async () => {
    const audio = audioRef.current;
    if (!audio || !available) return;
    try {
      await audio.play();
      setPlaying(true);
      writeSessionBoolean(sessionKeys.musicWanted, true);
    } catch {
      setPlaying(false);
    }
  };

  useImperativeHandle(forwardedRef, () => ({ start }));

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio || !available) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
      writeSessionBoolean(sessionKeys.musicWanted, false);
    } else {
      await start();
    }
  };

  return (
    <>
      <audio
        ref={audioRef}
        src={src}
        loop
        preload="none"
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
        onError={() => {
          setAvailable(false);
          setPlaying(false);
        }}
      />
      {visible ? (
        <button
          className={`music-control ${playing ? 'is-playing' : ''}`}
          type="button"
          onClick={() => void toggle()}
          aria-label={available ? `${playing ? 'Pause' : 'Play'} ${title}` : 'Background music unavailable'}
          aria-pressed={playing}
          disabled={!available}
          title={available ? title : 'Music file unavailable'}
        >
          <span className="music-rings" aria-hidden="true" />
          {available ? playing ? <Pause size={18} /> : <Play size={18} /> : <VolumeX size={18} />}
          <Music2 className="music-note" size={11} aria-hidden="true" />
        </button>
      ) : null}
    </>
  );
});
