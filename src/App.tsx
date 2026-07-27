import { AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { invitation } from './config/invitation';
import { LoadingScreen } from './components/common/LoadingScreen';
import { InvitationEntrance } from './components/common/InvitationEntrance';
import { MusicPlayer, type MusicPlayerHandle } from './components/common/MusicPlayer';
import { HeroSection } from './components/sections/HeroSection';
import { WelcomeSection } from './components/sections/WelcomeSection';
import { Countdown } from './components/sections/Countdown';
import { CoupleStory } from './components/sections/CoupleStory';
import { EventTimeline } from './components/sections/EventTimeline';
import { PhotoGallery } from './components/gallery/PhotoGallery';
import { VenueSection } from './components/sections/VenueSection';
import { GuestNotesSection } from './components/sections/GuestNotesSection';
import { ClosingSection } from './components/sections/ClosingSection';
import { Footer } from './components/sections/Footer';
import { useGsapScroll } from './hooks/useGsapScroll';
import { readSessionBoolean, sessionKeys, writeSessionBoolean } from './lib/session';

export function App() {
  const [loading, setLoading] = useState(true);
  const [opened, setOpened] = useState(() => readSessionBoolean(sessionKeys.opened));
  const pageRef = useRef<HTMLElement>(null);
  const musicRef = useRef<MusicPlayerHandle>(null);
  const ready = opened && !loading;

  useGsapScroll(pageRef, ready);

  useEffect(() => {
    let active = true;
    const image = new Image();
    const started = Date.now();
    const finish = () => {
      const remaining = Math.max(0, 550 - (Date.now() - started));
      window.setTimeout(() => {
        if (active) setLoading(false);
      }, remaining);
    };
    image.onload = finish;
    image.onerror = finish;
    image.src = invitation.images.hero;
    if (image.complete) finish();
    const fallback = window.setTimeout(() => active && setLoading(false), 1800);
    return () => {
      active = false;
      window.clearTimeout(fallback);
    };
  }, []);

  useEffect(() => {
    const shouldLock = loading || !opened;
    document.body.classList.toggle('scroll-locked', shouldLock);
    return () => document.body.classList.remove('scroll-locked');
  }, [loading, opened]);

  const openInvitation = () => {
    void musicRef.current?.start();
    writeSessionBoolean(sessionKeys.opened, true);
    setOpened(true);
  };

  return (
    <>
      <a className="skip-link" href="#welcome">
        Skip to invitation details
      </a>
      <MusicPlayer
        ref={musicRef}
        src={invitation.music.src}
        title={invitation.music.title}
        visible={ready}
      />
      <AnimatePresence>{loading ? <LoadingScreen key="loading" initials={invitation.initials} /> : null}</AnimatePresence>
      <AnimatePresence>
        {!loading && !opened ? (
          <InvitationEntrance key="entrance" invitation={invitation} onOpen={openInvitation} />
        ) : null}
      </AnimatePresence>
      <main
        ref={pageRef}
        className={`invitation-page ${ready ? 'is-open' : ''}`}
        aria-hidden={!opened}
      >
        <HeroSection invitation={invitation} />
        <WelcomeSection invitation={invitation} />
        <VenueSection invitation={invitation} />
        <Countdown weddingDate={invitation.weddingDate} timezone={invitation.timezone} />
        <CoupleStory invitation={invitation} />
        <EventTimeline invitation={invitation} />
        <PhotoGallery gallery={invitation.gallery} />
        {invitation.guestNotes.enabled ? (
          <GuestNotesSection
            coupleNames={`${invitation.brideName} & ${invitation.groomName}`}
            title={invitation.guestNotes.title}
            description={invitation.guestNotes.description}
          />
        ) : null}
        <ClosingSection invitation={invitation} />
        <Footer invitation={invitation} />
      </main>
    </>
  );
}
