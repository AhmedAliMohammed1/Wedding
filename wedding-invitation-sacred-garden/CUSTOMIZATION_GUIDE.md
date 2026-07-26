# Customization Guide

Almost every visible detail is in `src/config/invitation.ts`. Open that file in a text editor, change only the value after each colon, keep quotation marks and commas, then save.

## Names and monogram

Change:

- `brideName`
- `groomName`
- `initials`

Also update the text inside `public/favicon.svg` and the name fields in `public/manifest.webmanifest`.

## Date, time, and timezone

- `weddingDate` is an ISO date with an explicit UTC offset, for example `2026-08-11T16:00:00+03:00`.
- `endDate` uses the same format.
- `timezone` is an IANA timezone such as `Africa/Cairo`.
- `displayDate` is the long human-readable date.
- `shortDate` is the decorative compact date.

The countdown uses `weddingDate`. Verify the UTC offset for the venue on the wedding date, especially when daylight-saving time applies.

## Messages

Edit `openingMessage`, `introductionHeading`, `introduction`, and `closingMessage`. Normal straight apostrophes are safe inside double quotation marks.

## Venue and map

In the `venue` block, change the name, full display address, street, city, country name, country code, and venue image.

For a key-free map:

1. Open Google Maps and find the venue.
2. Choose **Share → Embed a map**.
3. Copy only the URL from the iframe `src`.
4. Paste it into `mapEmbedUrl`.
5. Copy a normal Google Maps directions link into `directionsUrl`.

Both URLs should begin with `https://`.

## Timeline

Each object in `schedule` is one event. Change `time`, `title`, `description`, and `icon`. Supported icons are `arrival`, `ceremony`, `drinks`, `dinner`, and `celebration`. Reorder whole objects to change the sequence.

## Images and music

Follow [ASSET_REPLACEMENT_GUIDE.md](ASSET_REPLACEMENT_GUIDE.md). Keep the current filenames for the easiest replacement.

## Colours and fonts

Core colours are CSS variables at the top of `src/styles/global.css` and are mirrored by name in `tailwind.config.ts`.

The three local font families are Cormorant Garamond, Great Vibes, and Montserrat. Font imports are in `src/main.tsx`. To change a font, install the new `@fontsource` package, update those imports, then update the matching `font-family` rules.

## Dress code

Edit the `dressCode` title, description, guidance, and colour list. Each colour needs a plain-language `name` and hexadecimal `hex` value. The visible name is important for accessibility.

## Gift section

Set `gift.enabled` to `false` to remove the entire section. When enabled, edit the title, message, preference, button label, and URL. Do not publish private bank details unless the couple has explicitly chosen to do so.

## RSVP

- Change `rsvp.deadline`.
- Change `rsvp.maxGuests` to control the guest-count selector and validation.
- Edit labels or choices in `src/components/forms/RSVPForm.tsx` only if the questions themselves must change.

If fields are added or renamed, make the same change in both the React form and the hidden static `wedding-rsvp` form in `index.html`. Netlify detects fields from the static form during deployment.

## Social preview and deployment URL

Edit `social.title`, `social.description`, `social.siteUrl`, and `social.image`. Then replace the placeholder URL in:

- `public/robots.txt`
- `public/sitemap.xml`

Run a fresh production build after any social or event data change. Vite generates the page meta tags and Event JSON-LD from the central configuration during the build.

## Optional sections

The gift section can be disabled in configuration. To hide another section, remove its component line from `src/App.tsx`; do not delete its source file if you may restore it later.

## Final check

Run:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run preview
```

Open the invitation on a phone and desktop, test the music, gallery, map, directions link, privacy note, and one real RSVP after Netlify deployment.
