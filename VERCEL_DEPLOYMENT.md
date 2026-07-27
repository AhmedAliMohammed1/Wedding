# Vercel Deployment

The invitation includes a native Vercel Function at `/api/notes`. Guest notes are stored as JSON objects in Vercel Blob, so they remain available across browsers, devices, and later deployments. The function automatically supports both Private and Public Blob stores; Private is recommended.

## First deployment

Deploy the complete project through Git or the Vercel CLI. Do not upload only the `dist` folder because it does not contain the server function.

Vercel should detect these settings automatically:

- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install`

## Connect persistent guest-note storage

This is required once for the Vercel project:

1. Open the project in the Vercel dashboard.
2. Select **Storage**.
3. Choose **Create Database**, then **Blob**.
4. Set the Blob store access to **Private** when Vercel offers that choice. An existing Public store is also supported automatically.
5. Create the store and connect it to this same project.
6. Enable the store for Production and Preview environments.
7. Confirm Vercel added `BLOB_READ_WRITE_TOKEN` to the project.
8. Redeploy the latest deployment.

Vercel creates and manages the token automatically. Never add it to the frontend, commit it to Git, or paste it into a public file.

## Verify after redeployment

1. Open the invitation.
2. Submit one note with a name.
3. Submit one anonymous note.
4. Select **Show all notes**.
5. Open the invitation from another browser or phone and confirm both notes appear.

If the page asks for a Vercel Blob store, the function is deployed correctly but the store is not yet connected. Complete the storage steps above and redeploy.

If the page says Vercel cannot access the connected store, reconnect that store to the project, confirm `BLOB_READ_WRITE_TOKEN` is enabled for the **Production** environment, and redeploy. The page now preserves this specific recovery instruction instead of replacing every server error with a generic unavailable message.

Unexpected server failures include an eight-character reference on the invitation and in the `/api/notes` Function log. API responses also include `X-Guest-Notes-Version`, which confirms exactly which server revision handled the request.

## Existing Vercel project

If the invitation is already deployed:

1. Replace or push the complete updated source project.
2. Connect a Blob store using the steps above. Private is recommended, and Public is supported.
3. Redeploy.

The included `vercel.json` keeps SPA navigation working and applies the invitation’s security headers. Filesystem routes take priority, so `/api/notes` continues to resolve to the Vercel Function.
