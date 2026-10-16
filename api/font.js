// /api/font — fonti zyrtar i Mus'hafit të Diyanetit (Shaikh Hamdullah Mushaf).
// Merret nga faqja e Diyanetit (kuran.diyanet.gov.tr/Yayinlar) dhe ruhet në CDN-në e Vercel për një vit,
// kështu funksioni thirret shumë rrallë. Nëse Diyanet nuk përgjigjet, aplikacioni kalon vetë te Scheherazade New.
const SOURCE = 'https://webdosya.diyanet.gov.tr/kuran/kuranikerim/dosyalar/font/KuranKerimFontHamdullah.ttf';

export default async function handler(req, res) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    const r = await fetch(SOURCE, { headers: { 'User-Agent': 'Mozilla/5.0 (JUZ Quran reader)' }, signal: ctrl.signal });
    clearTimeout(t);
    if (!r.ok) throw new Error(`upstream ${r.status}`);
    const buf = Buffer.from(await r.arrayBuffer());
    // një skedar TrueType fillon me 0x00010000 ose 'true'
    const sig = buf.subarray(0, 4).toString('hex');
    if (buf.length < 20000 || !['00010000', '74727565', '4f54544f'].includes(sig)) throw new Error('not a font');
    res.statusCode = 200;
    res.setHeader('Content-Type', 'font/ttf');
    res.setHeader('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end(buf);
  } catch (e) {
    res.statusCode = 502;
    res.setHeader('Cache-Control', 'no-store');
    res.end('font_unavailable');
  }
}
