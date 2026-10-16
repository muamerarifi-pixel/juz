// /api/qcf-font?p=293 — fonti QCF V4 me ngjyrat e texhvidit (COLRv1) për një faqe të Mus'hafit të Medinës (1–604).
// Merret nga CDN-ja e Quran Foundation dhe kalohet me cache të gjatë; telefoni e ruan pastaj për leximin pa internet.
const SOURCES = [
  (p) => `https://verses.quran.foundation/fonts/quran/hafs/v4/colrv1/woff2/p${p}.woff2`,
  (p) => `https://static-cdn.tarteel.ai/qul/fonts/quran_fonts/v4/colrv1/woff2/p${p}.woff2`,
];

async function fetchFont(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (JUZ Quran reader)' }, signal: ctrl.signal, cf: { cacheEverything: true, cacheTtl: 31536000 } });
    if (!r.ok) throw new Error(`upstream ${r.status}`);
    const buf = new Uint8Array(await r.arrayBuffer());
    // WOFF2 fillon me "wOF2"
    if (buf.length < 1000 || buf[0] !== 0x77 || buf[1] !== 0x4f || buf[2] !== 0x46 || buf[3] !== 0x32) throw new Error('not woff2');
    return buf;
  } finally { clearTimeout(t); }
}

export async function GET(request) {
  const url = new URL(request.url);
  const p = Number(url.searchParams.get('p'));
  if (!Number.isInteger(p) || p < 1 || p > 604) return new Response('bad_page', { status: 400, headers: { 'Cache-Control': 'no-store' } });
  for (const src of SOURCES) {
    try {
      const buf = await fetchFont(src(p));
      return new Response(buf, {
        status: 200,
        headers: {
          'Content-Type': 'font/woff2',
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch {}
  }
  return new Response('font_unavailable', { status: 502, headers: { 'Cache-Control': 'no-store' } });
}
