# Luna website

One static page: download (APK + QR code), privacy promise, features, FAQ and the full **privacy policy**
(link to it as `https://YOUR-DOMAIN/#privacy-policy` in Google Play / developer verification forms).

No build step, no cookies, no analytics, no third-party requests — fonts and images are self-hosted.

## Update the download
Edit **`config.js`** only:
- `apkUrl` → link to the APK (empty = "coming soon"; the QR then opens this page instead)
- `version`, `updated`, `apkSize`, optional `sha256`
- `contactEmail` → **required** before submitting to Google Play

## Get the APK
```bash
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile preview
```
Download the `.apk` from the build page, then host it somewhere permanent (EAS links can expire), e.g.
- **GitHub Releases** (free, recommended), or
- this folder: `website/download/luna-1.0.0.apk` → `apkUrl: 'download/luna-1.0.0.apk'`

Checksum (optional, shown on the page): `Get-FileHash .\luna-1.0.0.apk -Algorithm SHA256` (PowerShell)

## Host it (free options)
- **Cloudflare Pages / Netlify**: drag-and-drop this `website` folder.
- **GitHub Pages**: push the folder to a repo → Settings → Pages.
Use HTTPS (all three do it automatically). A custom domain later is easy to add.

## Preview locally
`npx serve website` (or open `index.html` directly in a browser).
