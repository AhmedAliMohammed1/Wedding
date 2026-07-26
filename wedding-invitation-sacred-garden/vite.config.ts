import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { invitation } from './src/config/invitation';

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

function invitationSeo(): Plugin {
  const eventData = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: `${invitation.brideName} & ${invitation.groomName}'s Wedding`,
    startDate: invitation.weddingDate,
    endDate: invitation.endDate,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    description: invitation.social.description,
    image: [`${invitation.social.siteUrl}${invitation.social.image}`],
    location: {
      '@type': 'Place',
      name: invitation.venue.name,
      address: {
        '@type': 'PostalAddress',
        streetAddress: invitation.venue.streetAddress,
        addressLocality: invitation.venue.city,
        addressCountry: invitation.venue.countryCode
      }
    },
    organizer: {
      '@type': 'Person',
      name: `${invitation.brideName} & ${invitation.groomName}`
    }
  };

  return {
    name: 'invitation-seo',
    transformIndexHtml(html) {
      return html
        .replaceAll('__SITE_TITLE__', escapeHtml(invitation.social.title))
        .replaceAll('__SITE_DESCRIPTION__', escapeHtml(invitation.social.description))
        .replaceAll('__SITE_URL__', escapeHtml(invitation.social.siteUrl))
        .replaceAll('__SOCIAL_IMAGE__', escapeHtml(`${invitation.social.siteUrl}${invitation.social.image}`))
        .replace('__EVENT_JSON_LD__', JSON.stringify(eventData).replaceAll('<', '\\u003c'));
    }
  };
}

export default defineConfig({
  plugins: [react(), invitationSeo()],
  build: {
    target: 'es2022',
    cssCodeSplit: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          animation: ['gsap', 'framer-motion'],
          gallery: ['swiper'],
          forms: ['react-hook-form', 'zod', '@hookform/resolvers']
        }
      }
    }
  }
});
