// Logjika e bashkimit (merge) — e përbashkët për klientin (app.js) dhe serverin (api/_store.js).
//
// Çdo vlerë ruhet si [koha, vlera]; vlera null = e fshirë. Fiton koha më e re (për harta: për çdo çelës).
// Në barazim kohe vendos krahasimi i JSON-it, që çdo pajisje të dalë me të njëjtin rezultat.

// 'v' = një vlerë e vetme, 'm' = hartë çelës → [t, vlerë]
export const SCHEMA = {
  sync: {
    bj: 'v',   // shënjuesi i ajetit në mënyrën xhuz { j, s, a, p } — ky është edhe progresi
    bs: 'v',   // shënjuesi i ajetit në mënyrën sure { s, a, p }
    wj: 'v',   // xhuzi i caktuar { w, j } — w = java kur u nis; vazhdon javët e tjera derisa të përfundojë
    kf: 'v',   // Kehfi i xhumasë { w, p, d? } (d = 1: u lexua)
    pg: 'm',   // xhuzi → { w, c } faqja e shënjuesit në atë xhuz këtë javë
    sp: 'm',   // sureja → faqja e shënjuesit
    bk: 'v',   // shënjuesi i hatmes { j, s, a, p }
    kt: 'v',   // hatmja { start: 'VVVV-MM-DD', days: 0 = pa afat, c: hatme të përfunduara }
    done: 'm', // xhuzi → java kur u përfundua
    wk: 'm',   // java → faqe të përfunduara (për seritë)
    st: 'v',   // cilësimet e përbashkëta
    dv: 'm',   // pajisjet
    dl: 'm',   // ditari i leximit: "VVVV-MM-DD.pajisja" → { p: faqe, t: sekonda } (çdo pajisje shkruan vetëm të vetat)
  },
};

export const isEntry = (e) => Array.isArray(e) && e.length === 2 && typeof e[0] === 'number' && Number.isFinite(e[0]);

export function lww(a, b) {
  const okA = isEntry(a), okB = isEntry(b);
  if (!okA) return okB ? b : undefined;
  if (!okB) return a;
  if (b[0] !== a[0]) return b[0] > a[0] ? b : a;
  return JSON.stringify(b[1]) > JSON.stringify(a[1]) ? b : a;
}

export function mergeMap(a, b) {
  const out = {};
  for (const k of [...new Set([...Object.keys(a || {}), ...Object.keys(b || {})])].sort()) {
    const v = lww(a && a[k], b && b[k]);
    if (v !== undefined) out[k] = v;
  }
  return out;
}

export function mergeDoc(a, b, schema) {
  const out = {};
  for (const [k, kind] of Object.entries(schema)) {
    if (kind === 'm') {
      const m = mergeMap(a && a[k], b && b[k]);
      if (Object.keys(m).length) out[k] = m;
    } else {
      const v = lww(a && a[k], b && b[k]);
      if (v !== undefined) out[k] = v;
    }
  }
  return out;
}

export const sameDoc = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ---------------------------------------------------------------- validimi (në server)

// Cilësimet që ndahen mes pajisjeve (madhësia e tekstit mbetet për çdo pajisje).
export const SYNCED_SETTINGS = {
  bg: ['paper', 'night'],
  font: ['hamdullah', 'scheherazade', 'naskh', 'harmattan', 'sans', 'kufi', 'qcf'],
  weight: [400, 500, 600, 700],
  trans: [true, false],
  latin: ['literata', 'lora', 'inter'],
  paper: ['classic', 'none', 'smooth', 'cotton', 'recycled', 'laid', 'linen', 'washi', 'antique'],
};

const WEEK = /^\d{4}-W\d{2}$/;
const NUM_KEY = /^\d{1,3}$/;
const KEY_RE = { dv: /^[a-z0-9]{8}$/, wk: WEEK, dl: /^\d{4}-\d{2}-\d{2}\.[a-z0-9]{8}$/ };
const MAX_KEYS = { pg: 32, sp: 120, done: 32, wk: 60, dv: 24, dl: 800 };
const FUTURE_SKEW = 24 * 3600 * 1000;
const int = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
const PAGE = [1, 640];

function cleanValue(field, v) {
  if (v === null) return null;
  if (!['sp', 'done', 'wk'].includes(field) && (!v || typeof v !== 'object')) return undefined;
  switch (field) {
    case 'sp': return int(v, ...PAGE) ? v : undefined;
    case 'done': return typeof v === 'string' && WEEK.test(v) ? v : undefined;
    case 'wk': return int(v, 0, 2000) ? v : undefined;
    case 'wj': return typeof v.w === 'string' && WEEK.test(v.w) && int(v.j, 1, 30) ? { w: v.w, j: v.j } : undefined;
    case 'kf': return typeof v.w === 'string' && WEEK.test(v.w) && int(v.p, ...PAGE) ? (v.d === 1 ? { w: v.w, p: v.p, d: 1 } : { w: v.w, p: v.p }) : undefined;
    case 'bj': return int(v.j, 1, 30) && int(v.s, 1, 114) && int(v.a, 1, 286) && int(v.p, ...PAGE) ? { j: v.j, s: v.s, a: v.a, p: v.p } : undefined;
    case 'bs': return int(v.s, 1, 114) && int(v.a, 1, 286) && int(v.p, ...PAGE) ? { s: v.s, a: v.a, p: v.p } : undefined;
    case 'pg': return typeof v.w === 'string' && WEEK.test(v.w) && int(v.c, ...PAGE) ? { w: v.w, c: v.c } : undefined;
    case 'st': {
      const o = {};
      for (const [k, allowed] of Object.entries(SYNCED_SETTINGS)) if (allowed.includes(v[k])) o[k] = v[k];
      return o;
    }
    case 'dv': return typeof v.n === 'string' ? { n: v.n.slice(0, 40), l: Number.isFinite(v.l) ? Math.round(v.l) : 0 } : undefined;
    case 'dl': return int(v.p, 0, 1000) && int(v.t, 0, 86400) ? { p: v.p, t: v.t } : undefined;
  }
  return undefined;
}

function cleanEntry(field, e, now) {
  if (!isEntry(e)) return undefined;
  const v = cleanValue(field, e[1]);
  if (v === undefined) return undefined;
  return [Math.min(Math.max(0, Math.round(e[0])), now + FUTURE_SKEW), v];
}

export function sanitize(doc, schema, now = Date.now()) {
  const out = {};
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) return out;
  for (const [k, kind] of Object.entries(schema)) {
    const src = doc[k];
    if (kind === 'm') {
      if (!src || typeof src !== 'object' || Array.isArray(src)) continue;
      const m = {};
      let n = 0;
      // për javët mbajmë më të rejat
      const keys = Object.keys(src).sort().reverse();
      for (const key of keys) {
        if (!(KEY_RE[k] || NUM_KEY).test(key)) continue;
        const e = cleanEntry(k, src[key], now);
        if (e === undefined) continue;
        m[key] = e;
        if (++n >= (MAX_KEYS[k] || 100)) break;
      }
      if (n) out[k] = m;
    } else {
      const e = cleanEntry(k, src, now);
      if (e !== undefined) out[k] = e;
    }
  }
  return out;
}
