# JUZ (v7)

A Quran reader: the Diyanet Mushaf with Hassan Nahi's Albanian translation, by juz or by surah.
It works offline and syncs between devices.

- The chosen juz stays active week after week until it is finished.
- Moving the bookmark forward counts the pages in between as read today; reading time is measured
  while the reader is open. "Leximi im" shows pages and time for every day of the month.
- Juz bookmark is gold, surah bookmark is blue; in "Suret" the main card follows the surah bookmark.
- The Mushaf page number is always shown in the reader. Ayah numbers use 1, 2, 3.
- 9 paper backgrounds, 6 Arabic fonts (3 for beginners), text transparency, rotation lock on phones.

**Live:** https://juz.muamer-arifi.workers.dev

## Deploying

This repo **is** the live app. Every push to `main` is built and deployed automatically by Cloudflare
Workers Builds (`npx wrangler deploy`) to the address above. Same domain, same sync, no manual step.

- Sync data is not in this repo. It lives in Upstash Redis, reached with the `KV_REST_API_URL` and
  `KV_REST_API_TOKEN` secrets set on the Cloudflare worker. A deploy never touches it.
- The sync format only grows: new fields are added (v7 added `dl`, the reading log), old ones are never
  renamed or removed, so older app versions and newer ones can sync with each other.
- Keep `"name": "juz"` in `wrangler.jsonc` (that keeps the same address) and never delete those secrets.
- Manual deploy, if ever needed: `npm install` then `npx wrangler deploy`.

When you change files in `public/`, raise `VERSION` in `public/sw.js` (e.g. `juz-v7.0.1-cf`) so phones
pick up the change. Phones that already have the app get it the next time they open it (a
"JUZ u përditësua" message appears).

## Layout

- `public/`: the app, served by Workers Static Assets: `index.html`, `style.css`, `app.js`,
  `merge.js` (sync schema + merge rules, shared with the server), `paper.js` (paper textures), `sw.js`, `manifest.json`, `_headers`, `data/` (605 Mushaf pages, 30 juz, the Albanian
  translation), `fonts/`, `textures/`, `icons/`
- `api/sync.js`, `api/_store.js`: sync through Upstash Redis
- `api/qr.js`: the QR code for linking devices
- `api/font.js`: fetches Diyanet's official "Shaikh Hamdullah Mushaf" font from kuran.diyanet.gov.tr;
  the app keeps it for offline use and falls back to Scheherazade New if it can't be reached
- `worker.js`: routes `/api/*` to the functions in `api/` and serves everything else from `public/`
- `scripts/build-data.mjs`: rebuilds the Quran data (`node scripts/build-data.mjs`); it writes to
  `data/`, so move the output into `public/data/`
- `tests/`: API and data tests (`npm install`, then `node --test tests/`)

## Local testing

Put the two `KV_…` secrets in a `.dev.vars` file (git-ignored), then `npm install` and `npm run dev`.

## Sources

- Arabic: the Diyanet Mushaf, from github.com/alperenugus/Kuran (CC BY 4.0)
- Albanian: Hassan Nahi, QuranEnc.com `albanian_nahi` v1.1.0 (AIITC)
- Fonts: Scheherazade New, Noto Naskh Arabic, Harmattan, Noto Sans Arabic, Noto Kufi Arabic, Literata, Lora, Inter (SIL OFL)
