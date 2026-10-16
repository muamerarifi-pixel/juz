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
// Numri i ajeteve për çdo sure: sa thirrje (50 ajete secila) i duhen quran.com-it.
const VERSES = [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];
const callsFor = (s) => Math.ceil(VERSES[s - 1] / 50);
// Një kërkesë e Cloudflare-it lejon pak thirrje jashtë (50 në planin falas): marrim deri në 40 faqe nga quran.com
// dhe aplikacioni pyet sërish për suret që mbetën ("more").
const BUDGET = 40;
const TTL = 400 * 24 * 3600; // rifreskohen vetë pas 400 ditësh

// Të gjitha suret e reja ruhen me një thirrje të vetme (pipeline i Upstash).
async function storeAll(entries) {
  const url = process.env.KV_REST_API_URL, token = process.env.KV_REST_API_TOKEN;
  if (!url || !token || !entries.length) return;
  await fetch(`${url.replace(/\/$/, '')}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(entries.map(([k, v]) => ['SET', k, v, 'EX', String(TTL)])),
  });
}

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
  // sa sure merren tani (brenda kufirit të thirrjeve); të tjerat kthehen te "more"
  const now = [];
  let used = 0;
  for (const s of missing) {
    if (now.length && used + callsFor(s) > BUDGET) break;
    now.push(s);
    used += callsFor(s);
  }
  const more = missing.slice(now.length);
  try {
    for (let i = 0; i < now.length; i += 4) {
      await Promise.all(now.slice(i, i + 4).map(async (s) => { out[s] = await loadSurah(s); }));
    }
  } catch (e) {
    return json(502, { error: 'qcf_unavailable' });
  }
  try { await storeAll(now.map((s) => [key(s), JSON.stringify(out[s])])); } catch {}
  return json(200, { v: QCF_VERSION, s: out, ...(more.length ? { more } : {}) }, more.length ? 'no-store' : 'public, max-age=2592000');
}
