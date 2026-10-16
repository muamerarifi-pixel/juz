# JUZ (v6)

A Quran reader: the Diyanet Mushaf with Hassan Nahi's Albanian translation, by juz or by surah. It works offline and syncs between devices.

## Updating the live app (same domain, same sync)

1. Unzip this file.
2. Open https://vercel.com → project **juz-vercel** → **Overview**.
3. Drag the unzipped **juz** folder onto that page ("drop your project anywhere on this page").
4. Wait until it says **Ready**. The site stays at **juz-vercel.vercel.app**, and sync keeps working: the `KV_…` database variables stay in the project.

Phones that already have the app get the new version automatically the next time they open it (a "JUZ u përditësua" message appears).

## What's inside

- `index.html`, `style.css`, `app.js`, `merge.js`, `sw.js`, `manifest.json`: the app (plain HTML/CSS/JS, no build step)
- `api/sync.js`, `api/_store.js`: sync through Upstash Redis (`KV_REST_API_URL`, `KV_REST_API_TOKEN`)
- `api/qr.js`: the QR code for linking devices
- `api/font.js`: fetches Diyanet's official "Shaikh Hamdullah Mushaf" font from kuran.diyanet.gov.tr. Vercel's CDN caches it for a year and the app keeps it for offline use. If it can't be reached, the app uses Scheherazade New.
- `data/`: the Diyanet Mushaf text (605 pages, 30 juz) and the Albanian translation
- `fonts/`, `textures/`, `icons/`
- `scripts/build-data.mjs`: rebuilds `data/` (`node scripts/build-data.mjs`)

When you change files later, raise `VERSION` in `sw.js` (e.g. `juz-v6.0.1`) so phones pick up the change.

## Sources

- Arabic: the Diyanet Mushaf, from github.com/alperenugus/Kuran (CC BY 4.0)
- Albanian: Hassan Nahi, QuranEnc.com `albanian_nahi` v1.1.0 (AIITC)
- Fonts: Scheherazade New, Literata, Lora, Inter (SIL OFL)
