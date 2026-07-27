# Validation Report

Validation date: July 27, 2026

## Environment

- Node.js: `v24.14.0`
- npm CLI used for final npm commands: `11.6.0`
- Operating system: Windows
- Project: `wedding-invitation-sacred-garden`

## Final invitation details

- Couple: Ahmed and Nada
- Date: Tuesday, August 11, 2026
- Venue: Le Palace Garden
- Location: Zagazig, Sharqia Governorate, Egypt
- Timezone: `Africa/Cairo`
- The supplied Google Maps embed URL is wired into the venue section.
- The supplied Le Palace Garden photograph is optimized as WebP and displayed inside the existing curved venue frame without changing its layout or styling.
- The former gift-style Gentle Note page is replaced by a persistent guest notes wall with named and anonymous posting plus an on-demand “Show all notes” view.
- Guest notes use one shared validation handler with native adapters for both Vercel and Netlify.
- Vercel stores notes in a connected Vercel Blob store with automatic Private/Public access detection; Netlify stores them in a strongly consistent site-wide Netlify Blobs store.
- The removed dress-code component has a migration-safe empty replacement and is excluded from TypeScript compilation so older extracted folders cannot retain the obsolete implementation.
- Reservation, guest-count, meal, dietary, and Netlify form features are removed. Migration-safe empty replacements overwrite the obsolete RSVP implementation in older extracted folders.

## Commands executed

The environment’s npm CLI was supplied through a temporary runner; the commands executed against this project were the standard npm commands shown below.

| Command | Result |
| --- | --- |
| `npm install` | Passed — lockfile version 3, dependencies up to date |
| `npm run check:dev` | Passed — local site and guest notes API completed a real write/read cycle |
| `npm run typecheck` | Passed — strict TypeScript project build, no errors |
| `npm run lint` | Passed — ESLint completed with zero errors and zero warnings |
| `npm run test` | Passed — 7 test files, 24 tests |
| `npm run build` | Passed — production `dist/` created |
| `npm run test:e2e` | Passed — 8 Playwright projects |

## Test coverage exercised

- Countdown formatting, invalid date, and post-event state
- Absence of RSVP configuration, reservation forms, and meal fields
- Named and anonymous guest note submissions
- On-demand loading and display of previous notes
- Nested Netlify error objects never render as `[object Object]`
- Static HTML fallbacks are detected with clear redeployment guidance
- Guest note API validation, spam blocking, chronological sorting, persistence calls, and rate-limit configuration
- Vercel Blob Private/Public access detection, writes, reads, pagination, chronological sorting, and actionable storage guidance
- Accessible music play/pause toggle
- Central configuration loading
- Configurable guest notes section
- Tap-to-open entrance action

## Production browser smoke test

Passed in installed Chromium-family browsers at:

- 320 × 568
- 375 × 667
- 390 × 844
- 430 × 932
- 768 × 1024
- 1024 × 768
- 1440 × 900
- 1920 × 1080

The test verified page load, entrance opening, scroll unlock, the venue as the third section, removal of the dress-code and reservation sections, absence of meal fields, countdown visibility, gallery navigation, venue/map markup, the guest note form, on-demand display of stored notes, absence of unexpected console errors, and no horizontal overflow.

## Live guest-notes browser test

Passed against the local Netlify-compatible runtime in a real browser:

- Submitted a named note and received confirmation.
- Submitted an anonymous note and received confirmation.
- Displayed both notes in the wall.
- Reopened the invitation in a fresh browser tab and confirmed both notes persisted.
- Confirmed `[object Object]` never appeared.
- Confirmed the browser console contained no errors.

## Netlify verification

- `dist/index.html` exists at the deployment root.
- No reservation or Netlify form markup is present.
- The `/api/notes` Netlify Function is configured with per-IP rate limiting.
- An explicit `/api/notes` rewrite is placed before the SPA fallback.
- Netlify Blobs stores notes across deployments without client-side credentials.
- SPA redirect, publish directory, and functions directory are configured in `netlify.toml`.
- Event JSON-LD, canonical metadata, Open Graph metadata, manifest, robots, and sitemap files are present.

## Vercel verification

- `api/notes.ts` is a native Vercel Function using the Web Request/Response API.
- Vercel Blob writes use immutable timestamp-and-ID paths and automatically match the connected store's access mode.
- Reads paginate through the complete notes folder and use cache bypassing for current private-blob content.
- Blob reads are batched to limit simultaneous connections.
- A missing `BLOB_READ_WRITE_TOKEN` returns clear Vercel storage setup guidance.
- `vercel.json` preserves SPA routing while filesystem precedence keeps `/api/notes` on the function.
- Vercel and Netlify share the same validation, anonymous-name removal, spam trap, response format, and sorting logic.

## Asset and security checks

- Runtime images, social preview, fonts, and audio are local.
- Hero and gallery images have explicit dimensions.
- Gallery images use WebP placeholders.
- No private keys, access tokens, passwords, or environment files are included.
- Anonymous submissions discard the supplied name before storage.
- Note content is length-limited and rendered as escaped React text.
- `node_modules`, test artifacts, caches, and source maps are excluded from the source ZIP.

## Known limitations

- Gallery and decorative images remain original placeholders intended to be replaced with the couple’s final assets.
- The selected background music is stored locally from the supplied reference page; permission or licensing should be confirmed before public distribution.
- The canonical deployment URL, sitemap URL, robots sitemap URL, and placeholder phone must be updated before public launch.
- Google Maps requires an internet connection.
- Guest notes appear immediately after submission. There is no couple-only moderation dashboard; notes can be reviewed or removed from the project’s Netlify Blobs page.
- Lighthouse score targets were considered through local assets, lazy loading, code splitting, and reduced font subsets, but no hosted Lighthouse run was recorded because final network and CDN conditions are deployment-specific.

## Final paths

- Project folder: `C:\Users\LOQ\OneDrive\Documents\Wedding\wedding-invitation-sacred-garden`
- Source ZIP: `C:\Users\LOQ\OneDrive\Documents\Wedding\wedding-invitation-sacred-garden-source.zip`
- Netlify ZIP: `C:\Users\LOQ\OneDrive\Documents\Wedding\wedding-invitation-sacred-garden-netlify.zip`
- Vercel ZIP: `C:\Users\LOQ\OneDrive\Documents\Wedding\wedding-invitation-sacred-garden-vercel.zip`
