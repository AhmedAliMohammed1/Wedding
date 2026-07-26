# Asset Replacement Guide

All replaceable files live under `public/assets`. Keep the existing filenames to replace an asset without touching code, or update the matching path in `src/config/invitation.ts`.

## Hero image

- File: `public/assets/images/hero-garden.webp`
- Recommended size: 1920 × 1280 px or larger
- Format: AVIF or WebP
- Target size: under 500 KB
- Composition: keep the couple or focal point near the centre. Leave calm space around the middle for names.

The hero uses `object-fit: cover`. Check both a 320 × 568 phone and a wide desktop after replacing it.

## Story and venue images

- Story main: 1200 × 1500 px, portrait, under 300 KB
- Story secondary: 900 × 1100 px, portrait, under 250 KB
- Venue: 1400 × 1000 px, landscape, under 350 KB

Use descriptive alt text in `src/config/invitation.ts` when an image contains meaningful personal content.

## Gallery

Gallery files are `gallery-01.webp` through `gallery-06.webp`.

- Recommended size: 1200 × 1500 px
- Aspect ratio: 4:5
- Format: AVIF or WebP
- Target size: under 300 KB each

To add or remove slides, edit the `gallery` array in `src/config/invitation.ts`. Every entry supports `src`, `alt`, `caption`, `width`, and `height`.

## Social sharing image

- File: `public/assets/images/social-preview-generated.webp`
- Recommended size: 1200 × 630 px
- Format: WebP, JPEG, or PNG
- Target size: under 500 KB

Update `social.image` if you rename the file. WhatsApp and some social networks cache previews, so use their sharing debugger or a new URL after changing it.

## Music

- Current file: `public/assets/audio/divenire.mp3`
- Recommended replacement: compressed MP3 or AAC, preferably under 5 MB
- Suggested bitrate: 128–192 kbps

Copy the new audio into `public/assets/audio`, then update `music.src` and `music.title` in the central configuration. Test on iOS Safari and Android Chrome. Audio begins only after the visitor taps the entrance, which is required by browsers.

## Monogram and decorations

The monogram is a React/CSS component. Change `initials` in the configuration for normal use. The favicon monogram is stored separately in `public/favicon.svg`; update its text when names change.

Botanical decorations are built with lightweight CSS. Optional optimized SVG replacements may be stored in `public/assets/decorations`; keep each under 100 KB and include meaningful labelling only when the artwork conveys information.

## Image optimization

Before deployment:

1. Resize to the final display dimensions.
2. Export photographs as AVIF or WebP at roughly 75–85% quality.
3. Remove EXIF location metadata.
4. Run `npm run build`.
5. Confirm no image request returns 404 in the browser network panel.

Tools such as Squoosh, ImageOptim, or Sharp can perform the conversion. Do not upscale a small photograph simply to meet the suggested dimensions.
