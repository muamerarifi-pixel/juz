// /api/qcf-text?s=2  ose  ?s=78-114
// Kodet e glifeve QCF V4 (fonti me ngjyrat e texhvidit i Kompleksit Mbreti Fahd), fjalë për fjalë,
// bashkë me faqen e Mus'hafit të Medinës ku ndodhet çdo fjalë (çdo faqe ka fontin e vet).
// Merren një herë nga API-ja publike e quran.com dhe ruhen përgjithmonë në Redis, pastaj vetëm lexohen.
//
// Përgjigja: { v, s: { "<sure>": { "<ajet>": [[faqja, "kod kod kod"], …] } } }
// (zakonisht një pjesë për ajet; dy kur ajeti kalon në faqen tjetër). Shenja e fundit të ajetit lihet jashtë:
// aplikacioni e vizaton numrin vetë me shifra perëndimore.
import { redis } from './_store.js';

const API = 'https://api.quran.com/api/v4/verses/by_chapter';
export const QCF_VERSION = 'v4a';
const key = (s) => `juz:qcf:${QCF_VERSION}:s${s}`;
const MAX_SPAN = 40;
const TTL = 400 * 24 * 3600; // rifreskohen vetë pas 400 ditësh

async function getJSON(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);
  try {
    const r = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'JUZ Quran reader' }, signal: ctrl.signal });
    if (!r.ok) throw new Error(`upstream ${r.status}`);
    return await r.json();
  } finally { clearTimeout(t); }
}

export function compact(verses) {
  const out = {};
  for (const v of verses) {
    const segs = [];
    for (const w of v.words || []) {
      if (w.char_type_name !== 'word' || !w.code_v2) continue;
      const p = Number(w.page_number || v.page_number);
      const last = segs[segs.length - 1];
      if (last && last[0] === p) last[1] += ` ${w.code_v2}`;
      else segs.push([p, w.code_v2]);
    }
    if (segs.length) out[v.verse_number] = segs;
  }
  return out;
}

async function loadSurah(s) {
  const base = `${API}/${s}?words=true&word_fields=code_v2,page_number&mushaf=19&per_page=50`;
  const first = await getJSON(`${base}&page=1`);
  const total = Number(first.pagination?.total_pages) || 1;
  const rest = await Promise.all(Array.from({ length: total - 1 }, (_, i) => getJSON(`${base}&page=${i + 2}`)));
  const verses = [first, ...rest].flatMap((j) => j.verses || []);
  const data = compact(verses);
  const expected = Number(first.pagination?.total_records) || verses.length;
  if (!verses.length || Object.keys(data).length !== expected) throw new Error(`incomplete surah ${s}`);
  return data;
}

const json = (status, body, cache) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': cache || 'no-store', 'Access-Control-Allow-Origin': '*' },
});

export async function GET(request) {
  const url = new URL(request.url);
  const m = /^(\d{1,3})(?:-(\d{1,3}))?$/.exec(url.searchParams.get('s') || '');
  const a = m ? +m[1] : 0;
  const b = m ? +(m[2] || m[1]) : 0;
  if (!m || a < 1 || b > 114 || a > b || b - a >= MAX_SPAN) return json(400, { error: 'bad_range' });

  const nums = Array.from({ length: b - a + 1 }, (_, i) => a + i);
  const out = {};
  let stored = [];
  try { stored = (await redis(['MGET', ...nums.map(key)])) || []; } catch { stored = []; }
  const missing = [];
  nums.forEach((s, i) => {
    try { if (stored[i]) { out[s] = JSON.parse(stored[i]); return; } } catch {}
    missing.push(s);
  });
  try {
    for (let i = 0; i < missing.length; i += 4) {
      await Promise.all(missing.slice(i, i + 4).map(async (s) => {
        out[s] = await loadSurah(s);
        try { await redis(['SET', key(s), JSON.stringify(out[s]), 'EX', String(TTL)]); } catch {}
      }));
    }
  } catch (e) {
    return json(502, { error: 'qcf_unavailable' });
  }
  return json(200, { v: QCF_VERSION, s: out }, 'public, max-age=2592000');
}
