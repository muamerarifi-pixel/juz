# JUZ (v6)

A Quran reader: the Diyanet Mushaf with Hassan Nahi's Albanian translation, by juz or by surah.
It works offline and syncs between devices.

**Live:** https://juz.muamer-arifi.workers.dev

## Deploying

This repo **is** the live app. Every push to `main` is built and deployed automatically by Cloudflare
Workers Builds (`npx wrangler deploy`) to the address above. Same domain, same sync, no manual step.

- Sync data is not in this repo. It lives in Upstash Redis, reached with the `KV_REST_API_URL` and
  `KV_REST_API_TOKEN` secrets set on the Cloudflare worker. A deploy never touches it.
- Keep `"name": "juz"` in `wrangler.jsonc` (that keeps the same address) and never delete those secrets.
- Manual deploy, if ever needed: `npm install` then `npx wrangler deploy`.

When you change files in `public/`, raise `VERSION` in `public/sw.js` (e.g. `juz-v6.1.2-cf`) so phones
pick up the change. Phones that already have the app get it the next time they open it (a
"JUZ u përditësua" message appears).

## Layout

- `public/`: the app, served by Workers Static Assets: `index.html`, `style.css`, `app.js`,
  `merge.js`, `sw.js`, `manifest.json`, `_headers`, `data/` (605 Mushaf pages, 30 juz, the Albanian
  translation), `fonts/`, `textures/`, `icons/`
- `api/sync.js`, `api/_store.js`: sync through Upstash Redis
- `api/qr.js`: the QR code for linking devices
- `api/font.js`: fetches Diyanet's official "Shaikh Hamdullah Mushaf" font from kuran.diyanet.gov.tr;
  the app keeps it for offline use and falls back to Scheherazade New if it can't be reached
- `worker.js`: routes `/api/*` to the functions in `api/` and serves everything else from `public/`
- `scripts/build-data.mjs`: rebuilds the Quran data (`node scripts/build-data.mjs`); it writes to
  `data/`, so move the output into `public/data/`
- `tests/`: API and data tests

## Local testing

Put the two `KV_…` secrets in a `.dev.vars` file (git-ignored), then `npm install` and `npm run dev`.

## Sources

- Arabic: the Diyanet Mushaf, from github.com/alperenugus/Kuran (CC BY 4.0)
- Albanian: Hassan Nahi, QuranEnc.com `albanian_nahi` v1.1.0 (AIITC)
- Fonts: Scheherazade New, Literata, Lora, Inter (SIL OFL)
