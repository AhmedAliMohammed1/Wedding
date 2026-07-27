# Netlify Deployment

No database credentials, API key, or environment variable is required. Netlify automatically provisions the Blobs store used by the shared notes wall.

## Method 1: Netlify project ZIP

Use `wedding-invitation-sacred-garden-netlify.zip`, supplied next to the project folder.

1. Sign in at [Netlify](https://app.netlify.com/).
2. Open [Netlify Drop](https://app.netlify.com/drop) or the manual deployment area for your existing project.
3. Drag `wedding-invitation-sacred-garden-netlify.zip` into the upload area.
4. Let Netlify detect the Vite project and run the configured build.
5. Wait for both the site and the `notes` function to finish deploying.
6. Open the generated URL and submit one named and one anonymous test note.
7. Choose **Show all notes** and confirm both notes appear.

The Netlify ZIP contains the buildable project at its root, including `package.json`, `netlify.toml`, and `netlify/functions/notes.mts`. Do not upload only `dist`; a static-only deployment cannot publish the notes API.

## Method 2: Git deployment

1. Push the complete source project to GitHub, GitLab, or Bitbucket.
2. In Netlify, choose **Add new site → Import an existing project**.
3. Connect the repository.
4. Confirm:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: `22`
5. Deploy the site.

No environment variables are required. The build, publish, and functions directories are already defined in `netlify.toml`.

## Guest notes storage

The notes endpoint is `/api/notes`. Netlify automatically creates the site-wide `wedding-guest-notes` Blobs store after the first accepted note.

- Notes remain available through later deployments.
- Anonymous posts are stored without the visitor’s name.
- Messages are limited to 500 characters.
- A spam trap and per-IP rate limit protect the endpoint.
- Stored notes can be inspected from the project’s **Blobs** page in Netlify.

## Custom domain and HTTPS

1. Open **Domain management** for the site.
2. Choose **Add a domain** and follow Netlify’s DNS instructions.
3. Netlify provisions HTTPS automatically after DNS is correct.
4. Set the final HTTPS URL in `src/config/invitation.ts`, `public/robots.txt`, and `public/sitemap.xml`.
5. Rebuild and redeploy so canonical, Open Graph, sitemap, and JSON-LD URLs match.

## Post-deployment checklist

- Entrance opens and scrolling unlocks.
- Music starts only after tapping.
- Countdown uses the correct local wedding time.
- Gallery swipes and keyboard arrows work.
- Map loads and directions open in a new tab.
- No reservation, guest-count, or meal form is present.
- Named and anonymous notes can be submitted.
- **Show all notes** reveals notes posted from another browser or device.
- Social preview shows the final names, date, and image.
- The site works on iOS Safari and Android Chrome.
