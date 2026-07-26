import { useLayoutEffect, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from './useReducedMotion';

gsap.registerPlugin(ScrollTrigger);

export function useGsapScroll(rootRef: RefObject<HTMLElement | null>, enabled: boolean) {
  const reducedMotion = useReducedMotion();

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || !enabled || reducedMotion) return;

    const context = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((element) => {
        gsap.fromTo(
          element,
          { y: 42, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1.05,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: element,
              start: 'top 84%',
              once: true
            }
          }
        );
      });

      gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((element) => {
        gsap.fromTo(
          element,
          { yPercent: -4 },
          {
            yPercent: 5,
            ease: 'none',
            scrollTrigger: {
              trigger: element,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 0.8
            }
          }
        );
      });

      gsap.fromTo(
        '.timeline-progress',
        { scaleY: 0 },
        {
          scaleY: 1,
          transformOrigin: 'top',
          ease: 'none',
          scrollTrigger: {
            trigger: '.event-timeline',
            start: 'top 72%',
            end: 'bottom 68%',
            scrub: 0.5
          }
        }
      );

      gsap.fromTo(
        '.closing-ornament',
        { scale: 0.86, opacity: 0, rotate: -4 },
        {
          scale: 1,
          opacity: 1,
          rotate: 0,
          duration: 1.4,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.closing-section',
            start: 'top 70%',
            once: true
          }
        }
      );
    }, root);

    return () => context.revert();
  }, [enabled, reducedMotion, rootRef]);
}
