# Sacred Garden Wedding Invitation

A production-ready, mobile-first digital wedding invitation for Ahmed and Nada. The experience combines an elegant tap-to-open entrance, user-initiated music, editorial botanical art, cinematic motion, practical event details, and a persistent guest note wall.

Names, dates, invitation messages, venue details, images, and optional sections are controlled from `src/config/invitation.ts`.

## Features

- Brief asset-aware loading screen and full-screen tap-to-open entrance
- Session-aware opening state and accessible background-music control
- Full-screen animated hero with botanical frame and reduced-motion support
- Live timezone-safe countdown with a post-event celebration state
- Editorial story composition, animated event timeline, and swipe gallery with lightbox
- Third-page venue details, key-free Google Maps embed, and closing message
- Shared guest notes posted with a name or anonymously and revealed on demand
- Native persistent guest-notes backends for both Vercel and Netlify
- Error boundary, keyboard support, visible focus states, and semantic page structure
- Local WebP artwork, local font files, original social preview, manifest, sitemap, robots, and Event JSON-LD
- Security and routing headers configured for both Vercel and Netlify

## Technology

React 19, Vite, TypeScript, Tailwind CSS, GSAP + ScrollTrigger, Framer Motion, Swiper, Lucide React, date-fns, Vercel Functions, Vercel Blob, Netlify Functions, Netlify Blobs, Vitest, Testing Library, and Playwright.

## Local setup

Use Node.js 20 or newer.

```bash
npm install
npm run dev
```

Vite prints the local URL, usually `http://localhost:5173`.

The Netlify Vite plugin runs the notes function and a local development blob store automatically. Local notes are development-only and are not uploaded to the live site.

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

## Guest notes

The “A gentle note” section lets visitors:

- publish a note with their name;
- publish as **Anonymous** without storing their entered name;
- reveal or hide previous notes with one button;
- browse six notes at a time with previous/next page controls;
- expand long notes with **Show more** and collapse them with **Show less**.

The browser sends notes to `/api/notes`. A shared server handler validates the content, discards names for anonymous posts, blocks a hidden spam field, rejects excessive repetition and injection-like text, and limits each visitor fingerprint to five accepted notes per ten minutes. Previously stored unsafe payloads are excluded from API results. On Vercel, a native Function stores each note in a Vercel Blob store and automatically supports either Private or Public access. On Netlify, the equivalent Function uses a strongly consistent Netlify Blobs store and matching platform rate limiting. Notes are rendered as plain React text, so visitor HTML is never injected into the page.

For Vercel, follow `VERCEL_DEPLOYMENT.md`. For Netlify, follow `NETLIFY_DEPLOYMENT.md`.

## Vercel deployment

Deploy the complete project and connect a **Vercel Blob** store from the project’s Storage page. Private access is recommended, but an existing Public store also works. New connections use Vercel OIDC with `BLOB_STORE_ID`; older connections may supply `BLOB_READ_WRITE_TOKEN`. Redeploy after connecting the store. See [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md).

## Netlify deployment

The included `netlify.toml` uses:

- Build command: `npm run build`
- Publish directory: `dist`
- Node version: 22
- Functions directory: `netlify/functions`
- Persistent storage: Netlify Blobs
- SPA fallback: `/* /index.html 200`

Because the notes wall includes a serverless function, deploy the supplied Netlify project ZIP while signed in, connect the source project to Git, or use the Netlify CLI. A static `dist`-only upload cannot publish the notes API. See [NETLIFY_DEPLOYMENT.md](NETLIFY_DEPLOYMENT.md).

## Assets

All runtime assets are local in `public/assets`. The Le Palace Garden section and the couple/gallery sections use the supplied photographs and illustrations; remaining decorative backgrounds are original botanical placeholders. The configured background music is stored locally from the selected reference invitation; confirm that you have permission to use it before public distribution. See [ASSET_REPLACEMENT_GUIDE.md](ASSET_REPLACEMENT_GUIDE.md).

## Accessibility

The invitation uses semantic landmarks, a logical heading structure, keyboard-operable controls, `aria-live` feedback, visible focus indicators, descriptive image text, reduced-motion behavior, and minimum 44px interactive targets.

## Browser support

Current Chrome, Edge, Firefox, Safari, iOS Safari, and Android Chrome are supported. Older browsers receive the full content with simplified motion. The Google Maps iframe requires an internet connection; all other visual assets are local.

## Troubleshooting

- **Music does not start:** Browsers require a user gesture. Open the invitation or tap the music control.
- **Music is unavailable:** Confirm the `music.src` file exists and its filename matches the configuration.
- **Map is blank:** Confirm the embed URL uses HTTPS and allows iframe embedding. Directions remain available separately.
- **Vercel asks for a Blob store:** Create and connect a Blob store in the Vercel project, then redeploy.
- **Vercel cannot access the connected store:** Reconnect the store, enable `BLOB_STORE_ID` for Production (or `BLOB_READ_WRITE_TOKEN` for an older connection), and redeploy.
- **Vercel reports a function error:** Copy the eight-character reference shown on the invitation and find the matching entry in the `/api/notes` Function log.
- **The notes service is not connected:** Deploy the complete source project so the host receives `/api/notes`; a `dist`-only upload contains no server function.
- **A note is rejected:** Keep the name between 2 and 60 characters and the message between 2 and 500 characters; use plain text without code, multiple links, or excessive repeated characters.
- **A replaced image appears cropped:** Use the dimensions and focal-point advice in the asset guide.
- **The countdown is wrong:** Use an ISO date with an explicit UTC offset, and set the IANA timezone alongside it.
