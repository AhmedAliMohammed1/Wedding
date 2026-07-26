# Sacred Garden Wedding Invitation

A production-ready, mobile-first digital wedding invitation for Ahmed and Nada. The experience combines an elegant tap-to-open entrance, user-initiated music, editorial botanical art, cinematic motion, practical event details, and a Netlify-ready static deployment.

All names, dates, messages, venue details, images, and optional sections are controlled from one file: `src/config/invitation.ts`.

## Features

- Brief asset-aware loading screen and full-screen tap-to-open entrance
- Session-aware opening state and accessible background-music control
- Full-screen animated hero with botanical frame and reduced-motion support
- Live timezone-safe countdown with a post-event celebration state
- Editorial story composition, animated event timeline, and swipe gallery with lightbox
- Third-page venue details, key-free Google Maps embed, gifts, and closing message
- Error boundary, keyboard support, visible focus states, and semantic page structure
- Local WebP artwork, local font files, original social preview, manifest, sitemap, robots, and Event JSON-LD
- Security and cache headers configured in `netlify.toml`

## Technology

React 19, Vite, TypeScript, Tailwind CSS, GSAP + ScrollTrigger, Framer Motion, Swiper, Lucide React, date-fns, Vitest, Testing Library, and Playwright.

## Local setup

Use Node.js 20 or newer.

```bash
npm install
npm run dev
```

Vite prints the local URL, usually `http://localhost:5173`.

## Commands

```bash
npm run dev          # Start the development server
npm run typecheck    # Strict TypeScript check
npm run lint         # ESLint with zero warnings
npm run test         # Vitest unit/component tests
npm run build        # Type-check and create dist/
npm run preview      # Preview the production build
npm run test:e2e     # Playwright production smoke tests
```

`npm run generate:assets` recreates the procedural placeholder images. It does not replace the configured music file.

## Configuration

Edit `src/config/invitation.ts`. See [CUSTOMIZATION_GUIDE.md](CUSTOMIZATION_GUIDE.md) for a field-by-field guide. The placeholder deployment URL appears in the `social` block and in `public/robots.txt` and `public/sitemap.xml`; replace all three before going live.

## Netlify deployment

The included `netlify.toml` uses:

- Build command: `npm run build`
- Publish directory: `dist`
- Node version: 22
- SPA fallback: `/* /index.html 200`

For exact drag-and-drop and Git instructions, see [NETLIFY_DEPLOYMENT.md](NETLIFY_DEPLOYMENT.md).

## Assets

All runtime assets are local in `public/assets`. The Le Palace Garden section uses the supplied venue photograph; the remaining decorative and gallery images are original abstract botanical placeholders. The configured background music is stored locally from the selected reference invitation; confirm that you have permission to use it before public distribution. See [ASSET_REPLACEMENT_GUIDE.md](ASSET_REPLACEMENT_GUIDE.md).

## Accessibility

The invitation uses semantic landmarks, a logical heading structure, keyboard-operable controls, `aria-live` feedback, visible focus indicators, descriptive image text, reduced-motion behavior, and minimum 44px interactive targets.

## Browser support

Current Chrome, Edge, Firefox, Safari, iOS Safari, and Android Chrome are supported. Older browsers receive the full content with simplified motion. The Google Maps iframe requires an internet connection; all other visual assets are local.

## Troubleshooting

- **Music does not start:** Browsers require a user gesture. Open the invitation or tap the music control.
- **Music is unavailable:** Confirm the `music.src` file exists and its filename matches the configuration.
- **Map is blank:** Confirm the embed URL uses HTTPS and allows iframe embedding. Directions remain available separately.
- **A replaced image appears cropped:** Use the dimensions and focal-point advice in the asset guide.
- **The countdown is wrong:** Use an ISO date with an explicit UTC offset, and set the IANA timezone alongside it.
