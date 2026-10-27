/**
 * ─── Edit only this file to update the site ───────────────────────────────
 *
 * After `eas build --platform android --profile preview` finishes:
 *  1. Download the .apk from the EAS build page.
 *  2. Upload it somewhere permanent (e.g. GitHub Releases, or put it in this
 *     website folder as  /download/luna.apk ). EAS links can expire.
 *  3. Paste the link in `apkUrl` below and bump `version` / `updated`.
 *  4. (Optional) paste the file's SHA-256 so people can verify the download:
 *       Windows PowerShell:  Get-FileHash .\luna.apk -Algorithm SHA256
 *
 * While `apkUrl` is empty the page shows "Coming soon" instead of a download.
 */
window.APP = {
  name: 'Luna',
  tagline: 'Your cycle, understood. Privately.',
  version: '1.0.0',
  updated: '27 October 2026',
  minAndroid: 'Android 7.0 or newer',

  apkUrl: '',      // e.g. 'https://github.com/you/luna/releases/download/v1.0.0/luna-1.0.0.apk'
  apkSize: '',     // e.g. '38 MB'
  sha256: '',      // optional checksum shown under the download button

  developer: 'Shykat Raha',
  contactEmail: 'shykat.raha29@gmail.com', // shown in the footer and privacy policy — required by Google Play
  location: 'Dhaka, Bangladesh',
};
