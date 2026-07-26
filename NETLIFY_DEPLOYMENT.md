# Netlify Deployment

No database, API key, environment variable, or paid service is required.

## Method 1: drag and drop

Use `wedding-invitation-sacred-garden-netlify.zip`, supplied next to the project folder.

1. Sign in at [Netlify](https://app.netlify.com/).
2. Open **Sites** or **Deploys** and choose the manual drag-and-drop option.
3. Drag `wedding-invitation-sacred-garden-netlify.zip` into the upload area.
4. Wait for the production deployment to finish.
5. Open the generated Netlify URL and submit one test RSVP.

The ZIP contains `index.html` at its root. Do not upload the source ZIP for drag-and-drop deployment.

## Method 2: Git deployment

1. Push the complete source project to GitHub, GitLab, or Bitbucket.
2. In Netlify, choose **Add new site → Import an existing project**.
3. Connect the repository.
4. Confirm:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: `22`
5. Deploy the site.

No environment variables are required. The same settings are already defined in `netlify.toml`.

## RSVP submissions

After the first deployment, Netlify should list a form called `wedding-rsvp`.

1. Open the site in a private browser window.
2. Submit a complete RSVP.
3. In Netlify, open **Forms → wedding-rsvp**.
4. Confirm the response and spam status.
5. Configure Netlify form notification emails if desired.

Local previews simulate success and do not create real submissions.

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
- RSVP appears in Netlify Forms.
- Social preview shows the final names, date, and image.
- The site works on iOS Safari and Android Chrome.
