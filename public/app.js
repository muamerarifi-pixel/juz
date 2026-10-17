// JUZ — Mus'hafi i Diyanetit me përkthimin shqip.
// Një xhuz në javë, Kehfi të premteve. Progresi ruhet VETËM kur shënon një ajet.
// JavaScript i thjeshtë, pa framework dhe pa hap ndërtimi.
import { SCHEMA, SYNCED_SETTINGS, mergeDoc, sameDoc } from './merge.js';

// ================================================================ konstante
const STATE_VERSION = 6;
const LS = { state: 'juz.state', ver: 'juz.v', code: 'juz.code', etag: 'juz.etag', settings: 'juz.settings', dev: 'juz.dev', rot: 'juz.rot', wkbase: 'juz.wkbase' };
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_RE = /^[A-Z2-9]{10}$/;
const PUSH_DEBOUNCE = 900;
const POLL_MS = 20000;
const BACKOFF_MS = 60000;
const OFF_BACKOFF_MS = 10 * 60000;
const FETCH_TIMEOUT = 12000;
const DEVICE_TOUCH_MS = 6 * 3600 * 1000;
const KAHF = 18;
const BASMALA = { d: 'بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحٖیمِ', h: 'بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّح۪يمِ' };
const AR_FONT = { hamdullah: "'Hamdullah'", scheherazade: "'Scheherazade New'", naskh: "'Noto Naskh Arabic'", harmattan: "'Harmattan'", sans: "'Noto Sans Arabic'", kufi: "'Noto Kufi Arabic'", qcf: "'Scheherazade New'" };
// Fontet kanë madhësi të ndryshme për të njëjtin numër: kjo i barazon me Scheherazade.
const AR_SCALE = { hamdullah: 1, scheherazade: 1, naskh: 1, harmattan: 1.12, sans: 0.95, kufi: 0.88, qcf: 1.12 };
const LATIN = { literata: "'Literata'", lora: "'Lora'", inter: "'Inter'" };
const THEME_COLOR = { paper: '#ece2cb', night: '#13120f' };
const DEFAULTS = { bg: 'paper', font: 'hamdullah', weight: 400, trans: true, latin: 'literata', size: 30, trSize: 17, home: 'juz', paper: 'classic', arTrans: 0, trTrans: 0, hold: true };
const SYNC_URL = '/api/sync';
const CH = SCHEMA.sync;
const DAYS = ['e diel', 'e hënë', 'e martë', 'e mërkurë', 'e enjte', 'e premte', 'e shtunë'];
const MONTHS = ['Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor', 'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor'];
const WD_SHORT = ['Hën', 'Mar', 'Mër', 'Enj', 'Pre', 'Sht', 'Die'];
const ORD = ['', 'parë', 'dytë', 'tretë', 'katërt', 'pestë', 'gjashtë', 'shtatë', 'tetë', 'nëntë', 'dhjetë'];
const IDLE_MS = 6 * 60000; // pa asnjë prekje/lëvizje për 6 min: koha e leximit ndalet

// ================================================================ ndihmës
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const arNum = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
const fmtCode = (c) => (c ? `${c.slice(0, 5)}-${c.slice(5)}` : '');
const val = (e) => (Array.isArray(e) ? e[1] : null);
const lsGet = (k, d = null) => { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch { return d; } };
const lsSet = (k, v) => { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const plain = (t) => t.replace(/\s?\[\d+\]/g, ''); // shenjat e fusnotave nuk shfaqen
// Një gabim në një pjesë të ndërfaqes nuk duhet ta rrëzojë aplikacionin.
const safe = (fn) => (...a) => { try { return fn(...a); } catch (e) { console.error(e); } };

export function extractCode(input) {
  const s = String(input || '').trim();
  const m = s.match(/[?&]k=([A-Za-z0-9-]+)/);
  return (m ? m[1] : s).toUpperCase().replace(/[^A-Z0-9]/g, '');
}
function randomString(alphabet, n) {
  const b = new Uint8Array(n);
  crypto.getRandomValues(b);
  return [...b].map((x) => alphabet[x % alphabet.length]).join('');
}
const newCode = () => randomString(ALPHABET, 10);

export function isoWeek(d = new Date()) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y = t.getUTCFullYear();
  const w = Math.ceil(((t - Date.UTC(y, 0, 1)) / 86400000 + 1) / 7);
  return `${y}-W${String(w).padStart(2, '0')}`;
}
const weekKey = () => isoWeek();
const weeksAgo = (k) => isoWeek(new Date(Date.now() - k * 7 * 86400000));
// E hëna e javës ISO "VVVV-Wjj" (ora lokale).
function weekMonday(key) {
  const [y, w] = key.split('-W').map(Number);
  const jan4 = new Date(y, 0, 4);
  return new Date(y, 0, 4 - ((jan4.getDay() + 6) % 7) + (w - 1) * 7);
}
// 1 = kjo javë, 2 = java e dytë që nga fillimi, …
const weekNo = (key) => Math.round((weekMonday(weekKey()) - weekMonday(key)) / (7 * 86400000)) + 1;
const ordinal = (n) => ORD[n] || `${n}-të`;
const pad2 = (n) => String(n).padStart(2, '0');
const ymd = (d = new Date()) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
function fmtDur(s, short = false) {
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), r = m % 60;
  if (short) return `${h}h ${pad2(r)}`;
  return `${h} orë${r ? ` ${r} min` : ''}`;
}
const daysLeftInWeek = () => 7 - ((new Date().getDay() + 6) % 7); // përfshin sot; java mbaron të dielën
// Kehfi: nga e enjtja në mbrëmje (pas akshamit, afërsisht ora 17) deri në fund të së premtes.
function isKahfTime(d = new Date()) {
  return d.getDay() === 5 || (d.getDay() === 4 && d.getHours() >= 17);
}

function ago(t) {
  const s = (Date.now() - t) / 1000;
  if (s < 90) return 'tani';
  const m = Math.round(s / 60);
  if (m < 60) return `para ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return h === 1 ? 'para 1 ore' : `para ${h} orësh`;
  const d = Math.round(h / 24);
  return d === 1 ? 'dje' : `para ${d} ditësh`;
}

let toastTimer;
function toast(msg, ms = 2800, action) {
  const t = $('#toast');
  t.innerHTML = `<span>${esc(msg)}</span>${action ? `<button type="button">${esc(action.label)}</button>` : ''}`;
  if (action) $('button', t).onclick = action.fn;
  t.hidden = false;
  clearTimeout(toastTimer);
  if (ms) toastTimer = setTimeout(() => (t.hidden = true), ms);
}

// ================================================================ motivimi
function motivate(pct) {
  if (pct <= 0) return 'Bismilah — fillo me faqen e parë.';
  if (pct < 15) return 'Fillim i bekuar! Vazhdo kështu.';
  if (pct < 35) return 'Po ecën bukur — çdo faqe ka vlerë.';
  if (pct < 48) return 'Edhe pak dhe arrin gjysmën!';
  if (pct < 60) return 'Gjysma e rrugës — Mashallah!';
  if (pct < 85) return 'Shumë mirë! Pjesa më e madhe u bë.';
  if (pct < 100) return 'Edhe pak — fundi është afër!';
  return 'Elhamdulilah, e përfundove! Allahu ta pranoftë.';
}

// ================================================================ pajisja
const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
function deviceName() {
  const ua = navigator.userAgent;
  let os = 'Pajisje';
  if (/iPhone|iPod/.test(ua)) os = 'iPhone';
  else if (/iPad/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) os = 'iPad';
  else if (/Android/.test(ua)) os = /Mobile/.test(ua) ? 'Android' : 'Tablet Android';
  else if (/Windows/.test(ua)) os = 'Windows';
  else if (/CrOS/.test(ua)) os = 'Chromebook';
  else if (/Mac OS X|Macintosh/.test(ua)) os = 'Mac';
  else if (/Linux/.test(ua)) os = 'Linux';
  let br = 'Shfletues';
  if (/EdgA?\//.test(ua)) br = 'Edge';
  else if (/SamsungBrowser/.test(ua)) br = 'Samsung Internet';
  else if (/OPR\//.test(ua)) br = 'Opera';
  else if (/Firefox|FxiOS/.test(ua)) br = 'Firefox';
  else if (/CriOS|Chrome\//.test(ua)) br = 'Chrome';
  else if (/Safari/.test(ua)) br = 'Safari';
  return `${os} · ${isStandalone() ? 'Aplikacioni JUZ' : br}`;
}
let DEV_ID = lsGet(LS.dev);
if (!/^[a-z0-9]{8}$/.test(DEV_ID || '')) { DEV_ID = randomString('abcdefghijkmnpqrstuvwxyz23456789', 8); lsSet(LS.dev, DEV_ID); }

// ================================================================ gjendja
let S = loadState();
function loadState() {
  let s = {};
  try { s = JSON.parse(lsGet(LS.state, '{}')) || {}; } catch {}
  const ver = +lsGet(LS.ver, 0);
  const o = {};
  for (const [k, kind] of Object.entries(CH)) o[k] = kind === 'm' ? (s[k] && typeof s[k] === 'object' && !Array.isArray(s[k]) ? s[k] : {}) : s[k];
  if (ver < STATE_VERSION) {
    // Migrimi: progresi i vjetër (i ruajtur automatikisht) hidhet; mbeten shënjuesit e ajeteve dhe xhuzet e përfunduara.
    o.pg = {}; o.sp = {}; o.wk = {};
    for (const f of ['bj', 'bs']) { const b = val(o[f]); if (!b || !b.a || !b.s) o[f] = undefined; }
    if (val(o.bj)) o.pg[val(o.bj).j] = [o.bj[0], { w: weekKey(), c: val(o.bj).p }];
    if (val(o.bs)) o.sp[val(o.bs).s] = [o.bs[0], val(o.bs).p];
  }
  if (ver < 6) {
    // v6: progres vetëm te shënjuesi aktual — progresi i mbetur në xhuze/sure të tjera fshihet (me shenjë fshirjeje që sinkronizohet).
    const t = Date.now();
    const pick = (m, cur) => { for (const k of Object.keys(m)) if (+k !== cur && m[k] && m[k][1] != null) m[k] = [Math.max(t, m[k][0] + 1), null]; };
    pick(o.pg, val(o.bj)?.j ?? latestKey(o.pg));
    pick(o.sp, val(o.bs)?.s ?? latestKey(o.sp));
  }
  if (ver < STATE_VERSION) {
    lsSet(LS.ver, String(STATE_VERSION));
    lsSet(LS.state, JSON.stringify(o));
  }
  return o;
}
const saveState = () => lsSet(LS.state, JSON.stringify(S));
const stamp = (prev) => Math.max(Date.now(), (Array.isArray(prev) ? prev[0] : 0) + 1);

function setVal(field, value) {
  if (S[field] && JSON.stringify(val(S[field])) === JSON.stringify(value)) return;
  if (!S[field] && value === null) return;
  S[field] = [stamp(S[field]), value];
  changed();
}
function setKey(field, key, value) {
  const m = S[field];
  const k = String(key);
  if (m[k] && JSON.stringify(m[k][1]) === JSON.stringify(value)) return;
  if (!m[k] && value === null) return;
  m[k] = [stamp(m[k]), value];
  changed();
}
function changed() {
  saveState();
  sync.dirty = true;
  schedulePush();
}
const doc = () => Object.fromEntries(Object.keys(CH).map((k) => [k, S[k]]));
function applyRemote(d) {
  const before = mergeDoc(doc(), {}, CH);
  const merged = mergeDoc(before, d, CH);
  if (sameDoc(merged, before)) return false;
  const oldSt = JSON.stringify(val(S.st));
  for (const [k, kind] of Object.entries(CH)) S[k] = merged[k] ?? (kind === 'm' ? {} : undefined);
  saveState();
  if (JSON.stringify(val(S.st)) !== oldSt) applySyncedSettings();
  return true;
}

// ================================================================ cilësimet
let settings = { ...DEFAULTS };
try { settings = { ...DEFAULTS, ...JSON.parse(lsGet(LS.settings, '{}')) }; } catch {}
function normalizeSettings() {
  settings.weight = +settings.weight || 400;
  for (const [k, allowed] of Object.entries(SYNCED_SETTINGS)) if (!allowed.includes(settings[k])) settings[k] = DEFAULTS[k];
  settings.size = clamp(+settings.size || DEFAULTS.size, 22, 50);
  settings.trSize = clamp(+settings.trSize || DEFAULTS.trSize, 14, 26);
  settings.arTrans = clamp(Math.round(+settings.arTrans || 0), 0, 60);
  settings.trTrans = clamp(Math.round(+settings.trTrans || 0), 0, 60);
  if (!['juz', 'surah'].includes(settings.home)) settings.home = 'juz';
  settings.hold = settings.hold !== false;
}
normalizeSettings();
const saveSettings = () => lsSet(LS.settings, JSON.stringify(settings));
const syncedSnapshot = () => Object.fromEntries(Object.keys(SYNCED_SETTINGS).map((k) => [k, settings[k]]));

// Fonti i Diyanetit vjen nga /api/font; nëse nuk ngarkohet, përdoret Scheherazade dhe teksti Unicode.
const fontState = { hamdullah: 'unknown' }; // unknown | ok | failed
const arFont = () => (settings.font === 'hamdullah' && fontState.hamdullah !== 'ok' ? 'scheherazade' : settings.font);
const textKey = () => (settings.font === 'qcf' ? 'q' : arFont() === 'hamdullah' ? 'h' : 'd');
const basmala = () => BASMALA[textKey() === 'h' ? 'h' : 'd'];
async function checkHamdullah() {
  if (fontState.hamdullah !== 'unknown' || !document.fonts) return;
  try {
    const timeout = new Promise((r) => setTimeout(() => r([]), 8000));
    const loaded = await Promise.race([document.fonts.load('24px "Hamdullah"', 'بسم'), timeout]);
    fontState.hamdullah = loaded && loaded.length && document.fonts.check('24px "Hamdullah"', 'بسم') ? 'ok' : 'failed';
  } catch { fontState.hamdullah = 'failed'; }
  applySettings();
  if (route.name === 'reader' && settings.font === 'hamdullah') rebuildReader();
}

function applySyncedSettings() {
  const st = val(S.st);
  if (!st) return;
  const prevKey = textKey();
  Object.assign(settings, st);
  normalizeSettings();
  saveSettings();
  applySettings();
  if (settings.font === 'hamdullah') checkHamdullah();
  if (route.name === 'reader' && prevKey !== textKey()) rebuildReader();
}

function applySettings() {
  const root = document.documentElement;
  const f = arFont();
  root.dataset.bg = settings.bg;
  window.JUZPaper?.apply(settings.paper, settings.bg === 'night');
  root.style.setProperty('--ar-size', `${settings.size}px`);
  root.style.setProperty('--ar-scale', AR_SCALE[f] || 1);
  root.style.setProperty('--tr-size', `${settings.trSize}px`);
  root.style.setProperty('--ar-font', AR_FONT[f]);
  root.style.setProperty('--latin', LATIN[settings.latin]);
  root.style.setProperty('--ar-alpha', (100 - settings.arTrans) / 100);
  root.style.setProperty('--tr-alpha', (100 - settings.trTrans) / 100);
  // Hamdullah ka vetëm një trashësi: trashësia jepet me vijë konture.
  const w = settings.weight;
  root.style.setProperty('--ar-weight', f === 'hamdullah' || f === 'qcf' ? 400 : w);
  root.style.setProperty('--ar-stroke', f === 'hamdullah' ? `${((w - 400) / 300) * 0.035}em` : '0px');
  document.body.classList.toggle('no-trans', !settings.trans);
  document.body.classList.toggle('qcf', f === 'qcf');
  document.body.classList.toggle('hold', settings.hold);
  $('#holdToggle').checked = settings.hold;
  const tone = settings.bg === 'paper' && window.JUZPaper?.TONES[settings.paper];
  $('meta[name="theme-color"]').content = tone || THEME_COLOR[settings.bg];
  for (const b of $$('#paperGrid button')) { const on = b.dataset.paper === settings.paper; b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on)); }
  $('#arTransRange').value = settings.arTrans;
  $('#arTransOut').textContent = `${settings.arTrans}%`;
  $('#trTransRange').value = settings.trTrans;
  $('#trTransOut').textContent = `${settings.trTrans}%`;
  for (const u of $$('.night-ic')) u.setAttribute('href', settings.bg === 'night' ? '#i-sun' : '#i-moon');
  for (const b of $$('[data-night]')) b.setAttribute('aria-label', settings.bg === 'night' ? 'Modaliteti i ditës' : 'Modaliteti i natës');
  for (const seg of $$('[data-setting]')) for (const b of $$('button', seg)) b.setAttribute('aria-pressed', String(String(settings[seg.dataset.setting]) === b.dataset.v));
  $('#trFields').hidden = !settings.trans;
  $('#transToggle').checked = settings.trans;
  $('#sizeRange').value = settings.size;
  $('#sizeOut').textContent = settings.size;
  $('#trSizeRange').value = settings.trSize;
  $('#trSizeOut').textContent = settings.trSize;
  const p = $('#previewAr');
  p.textContent = basmala();
  p.className = 'ar ar-txt';
  const hint = $('#fontHint');
  hint.hidden = !(settings.font === 'hamdullah' && fontState.hamdullah === 'failed');
  hint.textContent = 'Fonti i Diyanetit nuk u ngarkua (nevojitet internet herën e parë). Po përdoret Scheherazade.';
}

function setSetting(k, v) {
  if (settings[k] === v) return;
  const prevKey = textKey();
  settings[k] = v;
  saveSettings();
  applySettings();
  if (k in SYNCED_SETTINGS) setVal('st', syncedSnapshot());
  if (k === 'font' && v === 'hamdullah') checkHamdullah();
  if (route.name === 'reader' && prevKey !== textKey()) rebuildReader();
}

// ================================================================ të dhënat
let META, PAGES;
const juzCache = new Map();
function loadJuz(n) {
  if (juzCache.has(n)) return juzCache.get(n);
  const p = fetch(`/data/juz-${String(n).padStart(2, '0')}.json`).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); });
  juzCache.set(n, p);
  p.catch(() => juzCache.delete(n));
  if (juzCache.size > 6) juzCache.delete(juzCache.keys().next().value);
  return p;
}
const surah = (n) => META.surahs[n - 1];
const juzMeta = (j) => META.juz[j - 1];
const juzOfPage = (p) => (META.juz.find((j) => p >= j.pg[0] && p <= j.pg[1]) || META.juz[29]).n;
const pageCount = (range) => range[1] - range[0] + 1;
const printed = (p) => PAGES[p]?.n ?? p;

// ================================================================ progresi (vetëm nga shënjuesit)
// Vetëm NJË xhuz dhe NJË sure kanë progres: aty ku është shënjuesi aktual.
// (Nëse shënjuesi hiqet, mbetet ai me shënimin më të fundit.)
function latestKey(m) {
  let best = null, t = -1;
  for (const [k, e] of Object.entries(m || {})) if (Array.isArray(e) && e[1] != null && e[0] > t) { t = e[0]; best = +k; }
  return best;
}
const currentJuz = () => val(S.bj)?.j ?? latestKey(S.pg);
const currentSurah = () => val(S.bs)?.s ?? latestKey(S.sp);
// Kur shënjuesi kalon diku tjetër, progresi i vjetër fshihet (edhe në pajisjet e tjera).
function keepOnly(field, keep) {
  for (const k of Object.keys(S[field])) if (+k !== keep && S[field][k][1] != null) setKey(field, k, null);
}
const doneWeek = (j) => val(S.done[j]);
const isDone = (j) => doneWeek(j) === weekKey();
function juzProgress(j) {
  const jm = juzMeta(j);
  const count = pageCount(jm.pg);
  if (isDone(j)) return { read: count, count, pct: 100, state: 'done' };
  if (j !== currentJuz()) return { read: 0, count, pct: 0, state: 'new' };
  const bj = val(S.bj);
  const e = val(S.pg[j]) || (bj && bj.j === j ? { w: weekKey(), c: bj.p } : null);
  const dw = doneWeek(j);
  if (e && (!dw || e.w > dw)) {
    const read = clamp(e.c - jm.pg[0] + 1, 0, count);
    return { read, count, pct: Math.round((read / count) * 100), state: 'reading' };
  }
  if (dw) return { read: count, count, pct: 100, state: 'was-done' };
  return { read: 0, count, pct: 0, state: 'new' };
}
function surahProgress(s) {
  const su = surah(s);
  const count = pageCount(su.pg);
  if (s !== currentSurah()) return { read: 0, count, pct: 0 };
  const bs = val(S.bs);
  const at = val(S.sp[s]) ?? (bs && bs.s === s ? bs.p : null);
  const read = at ? clamp(at - su.pg[0] + 1, 0, count) : 0;
  return { read, count, pct: Math.round((read / count) * 100) };
}
// ---------------------------------------------------------------- ditari i leximit
// Çdo pajisje shkruan vetëm çelësat e vet ("VVVV-MM-DD.pajisja"), kështu dy pajisje nuk e mbishkruajnë njëra-tjetrën.
const myDayKey = () => `${ymd()}.${DEV_ID}`;
function logAdd(pages, secs = 0) {
  pages = Math.round(pages) || 0;
  secs = Math.round(secs) || 0;
  if (!pages && !secs) return;
  const k = myDayKey();
  const cur = val(S.dl[k]) || { p: 0, t: 0 };
  const next = { p: clamp(cur.p + pages, 0, 1000), t: clamp(cur.t + secs, 0, 86400) };
  if (next.p === cur.p && next.t === cur.t) return;
  setKey('dl', k, next);
}
// data → { p, t } (të gjitha pajisjet bashkë)
function dayTotals() {
  const out = {};
  for (const [k, e] of Object.entries(S.dl)) {
    const v = val(e);
    if (!v) continue;
    const o = (out[k.slice(0, 10)] ||= { p: 0, t: 0 });
    o.p += v.p;
    o.t += v.t;
  }
  return out;
}
// Java e përditësimit: faqet e lexuara para versionit 7 nuk janë në ditar, ndaj ruhet numri i vjetër i javës.
let WKBASE = null;
try { WKBASE = JSON.parse(lsGet(LS.wkbase, 'null')); } catch {}
if (!WKBASE || typeof WKBASE.w !== 'string') {
  WKBASE = { w: weekKey(), n: +val(S.wk[weekKey()]) || 0 };
  lsSet(LS.wkbase, JSON.stringify(WKBASE));
}
// Pas sinkronizimit të parë merret edhe numri i javës nga pajisjet e tjera (vetëm një herë).
function finalizeWkBase() {
  if (WKBASE.f) return false;
  const before = WKBASE.n;
  if (WKBASE.w === weekKey()) WKBASE.n = Math.max(WKBASE.n, +val(S.wk[WKBASE.w]) || 0);
  WKBASE.f = 1;
  lsSet(LS.wkbase, JSON.stringify(WKBASE));
  return WKBASE.n !== before;
}
function weekPages(w = weekKey()) {
  let n = 0;
  for (const [d, v] of Object.entries(dayTotals())) if (isoWeek(new Date(`${d}T12:00:00`)) === w) n += v.p;
  return WKBASE.w === w ? Math.max(n, WKBASE.n) : n;
}
const todayTotal = () => dayTotals()[ymd()] || { p: 0, t: 0 };
function streak() {
  let k = (val(S.wk[weekKey()]) || 0) > 0 ? 0 : 1;
  let n = 0;
  while (k < 60 && (val(S.wk[weeksAgo(k)]) || 0) > 0) { n++; k++; }
  return n;
}
// Xhuzi aktiv: ai që u zgjodh; mbetet aktiv javët e ardhshme derisa të përfundojë.
// (Kur përfundon, mbetet në kartë deri në fund të asaj jave, pastaj sugjerohet tjetri.)
function activeJuz() {
  const v = val(S.wj);
  if (!v) return null;
  const wk = weekKey();
  if (v.w === wk) return v.j;
  const dw = doneWeek(v.j);
  if (dw && dw >= v.w) return dw === wk ? v.j : null;
  return v.j;
}
const activeWeekNo = () => { const v = val(S.wj); return v ? Math.max(1, weekNo(v.w)) : 1; };
function suggestedJuz() {
  // xhuzi pas atij që u përfundua
  const v = val(S.wj);
  if (v && v.w !== weekKey()) return (v.j % 30) + 1;
  return 1;
}
const updateWeekTotal = () => setKey('wk', weekKey(), weekPages());
// Faqja e fundit e numëruar si e lexuar në këtë xhuz/sure (ose faqja para fillimit).
function unitPos(kind, n) {
  if (kind === 'j') {
    const pr = juzProgress(n);
    return juzMeta(n).pg[0] + (pr.state === 'reading' || pr.state === 'done' ? pr.read : 0) - 1;
  }
  return surah(n).pg[0] + surahProgress(n).read - 1;
}

// ================================================================ sinkronizimi
const sync = { code: null, status: 'idle', backoffUntil: 0, dirty: false, timer: null, busy: Promise.resolve(), lastOk: 0 };
function setStatus(status) {
  sync.status = status;
  for (const d of $$('[data-sync-dot]')) d.dataset.s = status;
  renderSyncStatus();
}
function queue(fn) { sync.busy = sync.busy.then(fn, fn).catch(() => {}); return sync.busy; }

async function request(method) {
  const code = sync.code;
  let url = `${SYNC_URL}?code=${code}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT);
  const opts = { method, headers: {}, cache: 'no-store', signal: ctrl.signal };
  if (method === 'GET') {
    const et = lsGet(LS.etag);
    if (et) url += `&etag=${encodeURIComponent(et)}`;
  } else {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify({ d: doc() });
  }
  try {
    const r = await fetch(url, opts);
    if (code !== sync.code || r.status === 304) return false;
    if (!r.ok) { const e = new Error(r.status === 503 ? 'not_configured' : `http_${r.status}`); e.http = r.status; throw e; }
    const j = await r.json();
    lsSet(LS.etag, j.etag);
    return applyRemote(j.d || {});
  } finally { clearTimeout(timer); }
}
function failed(e) {
  if (e.message === 'not_configured') { sync.backoffUntil = Date.now() + OFF_BACKOFF_MS; setStatus('off'); }
  else { sync.backoffUntil = Date.now() + BACKOFF_MS; setStatus(!navigator.onLine || !e.http ? 'offline' : 'error'); }
  if (sync.dirty) schedulePush(sync.backoffUntil - Date.now());
}
function ok(any) {
  sync.backoffUntil = 0;
  sync.lastOk = Date.now();
  setStatus('ok');
  const based = finalizeWkBase();
  if (any) { keepOnly('pg', currentJuz()); keepOnly('sp', currentSurah()); onRemoteChange(); }
  else if (based && route.name === 'home') renderHome();
}
function schedulePush(delay = PUSH_DEBOUNCE) {
  clearTimeout(sync.timer);
  sync.timer = setTimeout(() => push(), Math.max(delay, sync.backoffUntil - Date.now()));
}
function push(force = false) {
  return queue(async () => {
    if (!sync.code || (!force && !sync.dirty)) return;
    if (sync.status !== 'ok' && sync.status !== 'off') setStatus('busy');
    sync.dirty = false;
    try { ok(await request('POST')); } catch (e) { sync.dirty = true; failed(e); }
  });
}
function pull() {
  return queue(async () => {
    if (!sync.code || Date.now() < sync.backoffUntil) return;
    try { ok(await request('GET')); } catch (e) { failed(e); }
  });
}
function touchDevice(force = false) {
  const me = val(S.dv[DEV_ID]);
  const name = deviceName();
  if (force || !me || me.n !== name || Date.now() - me.l > DEVICE_TOUCH_MS) setKey('dv', DEV_ID, { n: name, l: Date.now() });
}
function useCode(code, toastMsg) {
  sync.code = code;
  lsSet(LS.code, code);
  lsSet(LS.etag, null);
  S.dv = S.dv[DEV_ID] ? { [DEV_ID]: S.dv[DEV_ID] } : {};
  saveState();
  touchDevice(true);
  sync.backoffUntil = 0;
  setStatus('busy');
  renderSync();
  push(true).then(() => { if (toastMsg && sync.status === 'ok') toast(toastMsg); renderSync(); });
}
function startSync() {
  let code = lsGet(LS.code);
  if (!code || !CODE_RE.test(code)) { code = newCode(); lsSet(LS.code, code); }
  sync.code = code;
  const params = new URLSearchParams(location.search);
  let joined = false;
  if (params.has('k')) {
    const k = extractCode(params.get('k'));
    params.delete('k');
    const qs = params.toString();
    history.replaceState(history.state, '', location.pathname + (qs ? `?${qs}` : '') + location.hash);
    if (CODE_RE.test(k) && k !== code) { useCode(k, `U lidhët me ${fmtCode(k)}`); joined = true; }
  }
  if (!joined) { touchDevice(); push(true); }
  setInterval(() => { if (document.visibilityState === 'visible') pull(); }, POLL_MS);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') { touchDevice(); pull(); if (route.name === 'home') renderHome(); }
    else if (sync.dirty) push();
  });
  addEventListener('online', () => { sync.backoffUntil = 0; push(true); });
  addEventListener('offline', () => setStatus('offline'));
}
const onRemoteChange = safe(() => {
  if (route.name === 'home') renderHome();
  if (route.name === 'reader') { decorateBm(); updatePill(); renderEnd(); }
  if (!$('#sheet-sync').hidden) renderSync();
  if (!$('#sheet-stats').hidden) renderStatsSheet();
});

// ================================================================ fletët
let openSheetEl = null;
let lastFocus = null;
function openSheet(name) {
  closeSheet(true);
  const el = $(`#sheet-${name}`);
  if (!el) return;
  if (name === 'sync') renderSync();
  if (name === 'about') renderAbout();
  if (name === 'pick') renderPick();
  if (name === 'stats') openStats();
  if (name === 'settings') { buildPaperGrid(); renderRot(); }
  lastFocus = document.activeElement;
  $('#scrim').hidden = false;
  el.hidden = false;
  el.scrollTop = 0;
  openSheetEl = el;
  requestAnimationFrame(() => $('[data-close]', el)?.focus({ preventScroll: true }));
}
function closeSheet(silent) {
  if (!openSheetEl) return;
  openSheetEl.hidden = true;
  openSheetEl = null;
  $('#scrim').hidden = true;
  if (!silent && lastFocus) lastFocus.focus?.({ preventScroll: true });
}

// ================================================================ ballina
const renderHome = safe(() => {
  const d = new Date();
  const [, w] = weekKey().split('-W');
  $('#weekLabel').textContent = `Java ${+w} · ${DAYS[d.getDay()]}`;
  for (const t of $$('[data-home]')) t.setAttribute('aria-selected', String(t.dataset.home === settings.home));
  $('#juzPane').hidden = settings.home !== 'juz';
  $('#surahPane').hidden = settings.home !== 'surah';
  const surahMode = settings.home === 'surah';
  $('#weekCard').classList.toggle('s-mode', surahMode);
  if (surahMode) renderSurahHero(); else renderWeek();
  renderKahf();
  renderStats();
  if (surahMode) renderSurahList(); else renderJuzGrid();
});

function renderWeek() {
  const j = activeJuz();
  const el = $('#weekCard');
  if (!j) {
    const s = suggestedJuz();
    const jm = juzMeta(s);
    el.innerHTML = `<div class="w-top"><span class="w-kicker">Xhuzi i radhës</span><button class="w-change" data-open="pick">Zgjidh tjetër</button></div>
      <div class="w-title"><b>Xhuzi ${s}</b><span>${arNum(s)}</span></div>
      <div class="w-range">${esc(surah(jm.s[0]).sq)} ${jm.s.join(':')} – ${esc(surah(jm.e[0]).sq)} ${jm.e.join(':')} · ${pageCount(jm.pg)} faqe</div>
      <p class="w-pace">${daysLeftInWeek()} ditë deri të dielën · rreth ${Math.ceil(pageCount(jm.pg) / daysLeftInWeek())} faqe në ditë</p>
      <p class="w-mot">Bismilah — cakto xhuzin dhe fillo. Nëse nuk e mbaron këtë javë, vazhdon edhe javën tjetër.</p>
      <button class="w-go" data-assign="${s}"><span>Fillo xhuzin ${s}</span><svg><use href="#i-fwd"/></svg></button>`;
    return;
  }
  const jm = juzMeta(j);
  const pr = juzProgress(j);
  const left = pr.count - pr.read;
  const days = daysLeftInWeek();
  const wn = activeWeekNo();
  const bj = val(S.bj);
  const resume = bj && bj.j === j;
  const kicker = wn > 1 ? `Xhuzi aktual · java e ${ordinal(wn)}` : 'Xhuzi i kësaj jave';
  const pace = pr.pct >= 100
    ? `E përfundove xhuzin${wn > 1 ? ` për ${wn} javë` : ''} — Elhamdulilah!`
    : `Edhe ${left} faqe · rreth ${Math.ceil(left / days)} në ditë deri të dielën${wn > 1 ? ', ose me ritmin tënd' : ''}`;
  el.innerHTML = `<div class="w-top"><span class="w-kicker">${kicker}</span><button class="w-change" data-open="pick">Ndrysho</button></div>
    <div class="w-title"><b>Xhuzi ${j}</b><span>${arNum(j)}</span></div>
    <div class="w-range">${esc(surah(jm.s[0]).sq)} ${jm.s.join(':')} – ${esc(surah(jm.e[0]).sq)} ${jm.e.join(':')} · Mus'hafi f. ${printed(jm.pg[0])}–${printed(jm.pg[1])}</div>
    <div class="w-prog"><span class="w-bar"><span style="width:${pr.pct}%"></span></span><span class="w-num">${pr.read} / ${pr.count} faqe · ${pr.pct}%</span></div>
    <p class="w-pace">${pace}</p>
    <p class="w-mot">${motivate(pr.pct)}</p>
    <button class="w-go" data-link="${resume ? `#/j/${j}/${bj.s}:${bj.a}` : `#/j/${j}`}">
      <span>${pr.pct >= 100 ? 'Rilexo xhuzin' : resume ? 'Vazhdo leximin' : 'Fillo leximin'}${resume ? `<small>${esc(surah(bj.s).sq)} ${bj.s}:${bj.a} · faqja ${pr.read} nga ${pr.count} · Mus'hafi f. ${printed(bj.p)}</small>` : ''}</span>
      <svg><use href="#i-fwd"/></svg></button>`;
}

// Mënyra "Suret": karta kryesore tregon suren që po lexon (shënjuesi i sureve, me ngjyrën e vet).
function renderSurahHero() {
  const el = $('#weekCard');
  const s = currentSurah();
  if (!s) {
    const su = surah(1);
    el.innerHTML = `<div class="w-top"><span class="w-kicker">Suret</span><button class="w-change" data-focus-search>Kërko</button></div>
      <div class="w-title"><b>Zgjidh një sure</b></div>
      <p class="w-pace">Hape një sure dhe prek ajetin ku ndalon — shënjuesi i sureve ruan progresin, veçmas nga xhuzi.</p>
      <p class="w-mot">Bismilah — çdo sure është një fillim i ri.</p>
      <button class="w-go" data-link="#/s/1"><span>Fillo me ${su.n}. ${esc(su.sq)}<small>${esc(su.mn)} · ${su.c} ajete</small></span><svg><use href="#i-fwd"/></svg></button>`;
    return;
  }
  const su = surah(s);
  const pr = surahProgress(s);
  const bs = val(S.bs);
  const resume = bs && bs.s === s;
  const left = pr.count - pr.read;
  const next = s < 114 ? surah(s + 1) : null;
  const finished = pr.pct >= 100;
  const go = finished && next
    ? `<button class="w-go" data-link="#/s/${next.n}"><span>Vazhdo me ${next.n}. ${esc(next.sq)}<small>${esc(next.mn)} · ${next.c} ajete · ${pageCount(next.pg)} faqe</small></span><svg><use href="#i-fwd"/></svg></button>`
    : `<button class="w-go" data-link="${resume ? `#/s/${s}/${bs.s}:${bs.a}` : `#/s/${s}`}">
        <span>${finished ? 'Rilexo suren' : resume ? 'Vazhdo leximin' : 'Fillo leximin'}${resume ? `<small>${esc(su.sq)} ${bs.s}:${bs.a} · faqja ${pr.read} nga ${pr.count} · Mus'hafi f. ${printed(bs.p)}</small>` : ''}</span>
        <svg><use href="#i-fwd"/></svg></button>`;
  el.innerHTML = `<div class="w-top"><span class="w-kicker">Sureja që po lexon</span><button class="w-change" data-focus-search>Kërko</button></div>
    <div class="w-title"><b>${s}. ${esc(su.sq)}</b><span lang="ar">${esc(su.ar)}</span></div>
    <div class="w-range">${esc(su.mn)} · ${su.c} ajete · ${su.r === 'M' ? 'Medinase' : 'Mekase'} · Mus'hafi f. ${printed(su.pg[0])}${su.pg[1] > su.pg[0] ? `–${printed(su.pg[1])}` : ''}</div>
    <div class="w-prog"><span class="w-bar"><span style="width:${pr.pct}%"></span></span><span class="w-num">${pr.read} / ${pr.count} faqe · ${pr.pct}%</span></div>
    <p class="w-pace">${finished ? `Të ${su.c} ajetet, ${pr.count} faqe — të gjitha të lexuara.` : `Edhe ${left} faqe deri në fund të sures`}</p>
    <p class="w-mot">${motivate(pr.pct)}</p>
    ${go}`;
}

function renderKahf() {
  const el = $('#kahfCard');
  const k = val(S.kf);
  const thisWeek = k && k.w === weekKey();
  const show = isKahfTime() || (thisWeek && new Date().getDay() === 5);
  el.hidden = !show;
  if (!show) return;
  const su = surah(KAHF);
  const count = pageCount(su.pg);
  const read = thisWeek ? (k.d ? count : clamp(k.p - su.pg[0] + 1, 0, count)) : 0;
  const pct = Math.round((read / count) * 100);
  const bs = val(S.bs);
  const resume = bs && bs.s === KAHF && thisWeek && !k.d;
  el.innerHTML = `<div class="k-top"><span class="k-ic"><svg><use href="#i-cave"/></svg></span>
      <div><strong>${new Date().getDay() === 5 ? 'Xhuma mubarek' : 'Nesër është xhuma'} — Sureja Kehf</strong><span class="k-sub">Shpella · ${su.c} ajete · ${count} faqe</span></div></div>
    <div class="bar"><span style="width:${pct}%"></span></div>
    <div class="row">${pct >= 100
      ? `<span class="k-sub">✓ E lexove Kehfin këtë xhuma — Allahu ta pranoftë!</span>`
      : `<button class="btn gold small" data-link="${resume ? `#/s/${KAHF}/${bs.s}:${bs.a}` : `#/s/${KAHF}`}">${resume ? `Vazhdo · ${read}/${count} faqe` : 'Lexo Kehfin'}</button>`}</div>`;
}

function renderStats() {
  const pages = weekPages();
  const today = todayTotal();
  const st = streak();
  const done = META.juz.filter((j) => isDone(j.n)).length;
  const msg = today.p === 0 && pages === 0 ? 'Një faqe sot është fillim i mirë.' : st > 1 ? 'Mos e këput serinë — Allahu ta lehtësoftë!' : 'Çdo faqe që kupton të afron më shumë.';
  $('#statLine').innerHTML = `<span class="st"><svg><use href="#i-book"/></svg>Sot: <b>${today.p}</b> faqe${today.t >= 60 ? ` · ${fmtDur(today.t)}` : ''}</span>
    <span class="st"><svg><use href="#i-check"/></svg>Këtë javë: <b>${pages}</b> faqe${done ? ` · <b>${done}</b> xhuz${done > 1 ? 'e' : ''} i plotë` : ''}</span>
    <span class="st"><svg><use href="#i-flame"/></svg><b>${st}</b> javë rresht</span>
    <span class="msg">${msg}</span>
    <span class="more"><svg><use href="#i-cal"/></svg>Leximi im çdo ditë<svg><use href="#i-fwd"/></svg></span>`;
}

// ---------------------------------------------------------------- statistikat e muajit
const statView = { y: 0, m: 0 };
function openStats() {
  const d = new Date();
  statView.y = d.getFullYear();
  statView.m = d.getMonth();
  flushReading();
  renderStatsSheet();
}
const renderStatsSheet = safe(() => {
  const { y, m } = statView;
  const days = dayTotals();
  const now = new Date();
  const todayStr = ymd(now);
  const nDays = new Date(y, m + 1, 0).getDate();
  const offset = (new Date(y, m, 1).getDay() + 6) % 7;
  const list = [];
  for (let d = 1; d <= nDays; d++) { const k = `${y}-${pad2(m + 1)}-${pad2(d)}`; list.push({ d, k, ...(days[k] || { p: 0, t: 0 }) }); }
  const pages = list.reduce((a, x) => a + x.p, 0);
  const secs = list.reduce((a, x) => a + x.t, 0);
  const active = list.filter((x) => x.p > 0 || x.t >= 60);
  const best = list.reduce((b, x) => (x.p > (b?.p || 0) ? x : b), null);
  const max = Math.max(1, ...list.map((x) => x.p));
  const isCur = y === now.getFullYear() && m === now.getMonth();
  $('#mTitle').textContent = `${MONTHS[m]} ${y}`;
  $('#mNext').disabled = isCur || new Date(y, m + 1, 1) > now;
  $('#mSum').innerHTML = `<div><b>${pages}</b><span>faqe</span></div>
    <div><b>${secs >= 60 ? fmtDur(secs) : '0 min'}</b><span>kohë leximi</span></div>
    <div><b>${active.length}</b><span>ditë leximi</span></div>
    <div><b>${active.length ? Math.round(pages / active.length) : 0}</b><span>faqe në ditë</span></div>`;
  let html = WD_SHORT.map((w) => `<span class="cal-h" role="columnheader">${w}</span>`).join('');
  html += '<span class="cal-x"></span>'.repeat(offset);
  for (const x of list) {
    const fut = x.k > todayStr;
    const lvl = x.p ? 0.18 + 0.62 * (x.p / max) : 0;
    const label = `${x.d} ${MONTHS[m]}: ${x.p} faqe${x.t >= 60 ? `, ${fmtDur(x.t)}` : ''}`;
    html += `<span class="cal-d${x.k === todayStr ? ' today' : ''}${fut ? ' fut' : ''}${x.p || x.t >= 60 ? ' has' : ''}${lvl >= 0.55 ? ' hi' : ''}" role="gridcell" aria-label="${label}" title="${label}" style="--lvl:${Math.round(lvl * 100)}%">
      <i>${x.d}</i>${x.p ? `<b>${x.p}</b>` : ''}${x.t >= 60 ? `<small>${fmtDur(x.t, true)}</small>` : ''}</span>`;
  }
  $('#cal').innerHTML = html;
  $('#mNote').textContent = best && best.p
    ? `Dita më e mirë: ${best.d} ${MONTHS[m]} · ${best.p} faqe${best.t >= 60 ? ` · ${fmtDur(best.t)}` : ''}`
    : isCur ? 'Ende asnjë faqe këtë muaj — shëno një ajet kur lexon dhe faqet numërohen vetë.' : 'Asnjë lexim i regjistruar në këtë muaj.';
});

function bmChip(el, text, link) {
  el.hidden = !text;
  if (!text) return;
  el.innerHTML = `<svg><use href="#i-bm"/></svg><span>${text}</span><svg><use href="#i-fwd"/></svg>`;
  el.dataset.link = link;
}

function renderJuzGrid() {
  const bj = val(S.bj);
  const wj = activeJuz();
  const wTag = activeWeekNo() > 1 ? 'aktual' : 'kjo javë';
  bmChip($('#bjChip'), bj && bj.j !== wj && `Shënjuesi: <b>${esc(surah(bj.s).sq)} ${bj.s}:${bj.a}</b> · Xhuzi ${bj.j}`, bj && `#/j/${bj.j}/${bj.s}:${bj.a}`);
  $('#juzGrid').innerHTML = META.juz.map((j) => {
    const su = surah(j.s[0]);
    const pr = juzProgress(j.n);
    const label = pr.state === 'done' ? 'E përfunduar · <b>100%</b>'
      : pr.state === 'reading' ? `<b>${pr.read}</b> / ${pr.count} faqe · <b>${pr.pct}%</b>`
      : pr.state === 'was-done' ? `✓ Lexuar · ${pr.count} faqe` : `${pr.count} faqe`;
    const bar = pr.state === 'was-done' ? 0 : pr.pct;
    return `<li><button class="juz-card card${j.n === wj ? ' week' : ''}${pr.state === 'done' ? ' is-done' : ''}${pr.state === 'was-done' ? ' was-done' : ''}" data-j="${j.n}" aria-label="Xhuzi ${j.n}, ${pr.read} nga ${pr.count} faqe">
      <span class="n">${j.n}</span>
      <span class="from">${esc(su.sq)} ${j.s[0]}:${j.s[1]}</span>
      ${pr.state === 'done' ? '<span class="seal" aria-hidden="true"><svg><use href="#i-check"/></svg></span>' : `<span class="jar">${arNum(j.n)}</span>`}
      ${j.n === wj && pr.state !== 'done' ? `<span class="tag-w">${wTag}</span>` : ''}
      <span class="pr"><span class="bar"><span style="width:${bar}%"></span></span><span class="pt">${label}</span></span>
    </button></li>`;
  }).join('');
}

const fold = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ'’\- ]/g, '');
function renderSurahList() {
  // Shënjuesi i sureve shfaqet në kartën kryesore, ndaj çipi këtu nuk nevojitet.
  bmChip($('#bsChip'), null);
  const cur = currentSurah();
  const q = fold($('#surahSearch').value.trim());
  const list = META.surahs.filter((s) => !q || String(s.n) === q || fold(s.sq).includes(q) || fold(s.mn).includes(q) || fold(s.tr).includes(q));
  $('#surahList').innerHTML = list.length ? list.map((s) => {
    const pr = surahProgress(s.n);
    return `<li><button class="surah-row card${s.n === cur ? ' cur' : ''}" data-s="${s.n}">
      <span class="star-num">${s.n}</span>
      <span class="nm"><strong>${esc(s.sq)} <i>· ${esc(s.mn)}</i></strong><span>${s.c} ajete · ${s.r === 'M' ? 'Medinase' : 'Mekase'} · ${pr.count} faqe${pr.read ? ` · <b>${pr.read}/${pr.count}</b>` : ''}</span>
      ${pr.read ? `<span class="bar"><span style="width:${pr.pct}%"></span></span>` : ''}</span>
      <span class="ar-nm" lang="ar">${esc(s.ar)}</span>
    </button></li>`;
  }).join('') : '<li class="empty">Asnjë sure me këtë emër.</li>';
}

function renderPick() {
  const wj = activeJuz();
  $('#pickGrid').innerHTML = META.juz.map((j) => `<button data-assign="${j.n}" aria-pressed="${j.n === wj}" class="${isDone(j.n) ? 'done' : ''}">${j.n}</button>`).join('');
}
function assignWeek(j) {
  // I njëjti xhuz: mbetet java kur u nis (që të numërohet "java e dytë", …).
  if (activeJuz() !== j) setVal('wj', { w: weekKey(), j });
  closeSheet(true);
  renderHome();
}

// ================================================================ QCF V4: Mus'hafi i Medinës me ngjyrat e texhvidit
// Çdo faqe e Mus'hafit të Medinës (1–604) ka fontin e vet me ngjyra (COLRv1); çdo fjalë shkruhet me kodin e saj.
// Kodet vijnë nga /api/qcf-text, fontet nga /api/qcf-font (të dyja ruhen në telefon pas herës së parë).
const QCF = { text: new Map(), faces: new Map(), warned: false };
const QCF_CDN = (p) => `https://verses.quran.foundation/fonts/quran/hafs/v4/colrv1/woff2/p${p}.woff2`;
const qcfFam = (p) => `QCF4 P${p}`;
const qcfSegs = (x) => QCF.text.get(x.s)?.[x.a] || null;
function surahSpan(pages) {
  let a = 999, b = 0;
  for (const pg of pages) for (const x of pg.items) { if (x.s < a) a = x.s; if (x.s > b) b = x.s; }
  return [a, b];
}
function qcfReady(pages) {
  const [a, b] = surahSpan(pages);
  for (let s = a; s <= b; s++) if (!QCF.text.has(s)) return false;
  return true;
}
async function qcfEnsure(pages) {
  const [a, b] = surahSpan(pages);
  const need = [];
  for (let s = a; s <= b; s++) if (!QCF.text.has(s)) need.push(s);
  if (!need.length) return;
  // Serveri mund të kthejë vetëm një pjesë herën e parë ("more"): pyetet sërish derisa të vijnë të gjitha.
  for (let round = 0; round < 12; round++) {
    const left = need.filter((s) => !QCF.text.has(s));
    if (!left.length) return;
    const lo = left[0], hi = Math.min(left[left.length - 1], lo + 39);
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 45000);
    try {
      const r = await fetch(`/api/qcf-text?s=${lo}-${hi}`, { signal: ctrl.signal });
      if (!r.ok) throw new Error(`qcf ${r.status}`);
      const j = await r.json();
      for (const [k, m] of Object.entries(j.s || {})) QCF.text.set(+k, m);
    } finally { clearTimeout(t); }
  }
  if (need.some((s) => !QCF.text.has(s))) throw new Error('qcf incomplete');
}
function qcfPalettes() {
  let el = document.getElementById('qcfPal');
  if (!el) { el = document.createElement('style'); el.id = 'qcfPal'; document.head.append(el); }
  const fams = [...QCF.faces.keys()].map((p) => `"${qcfFam(p)}"`).join(', ');
  // Natën: paleta e errët e fontit (1); ditën: e çelëta (0, parazgjedhje).
  el.textContent = fams ? `@font-palette-values --qcf-dark { font-family: ${fams}; base-palette: 1; }` : '';
}
function qcfFace(p) {
  let f = QCF.faces.get(p);
  if (f) return f;
  f = new FontFace(qcfFam(p), `url(/api/qcf-font?p=${p}) format('woff2'), url(${QCF_CDN(p)}) format('woff2')`, { display: 'block' });
  document.fonts.add(f);
  QCF.faces.set(p, f);
  qcfPalettes();
  return f;
}
const qcfHTML = (segs) => segs.map(([p, c]) => `<span class="qf" style="font-family:'${qcfFam(p)}'">${esc(c)}</span>`).join(' ');
function ayahItem(k) {
  for (const pg of R.pages) for (const x of pg.items) if (`${x.s}:${x.a}` === k) return x;
  return null;
}
// Nëse fontet e një faqeje nuk ngarkohen, ajetet e saj shkruhen me Scheherazade.
function qcfFallback(sec) {
  for (const at of $$('.at.q', sec)) {
    const x = ayahItem(at.closest('.ay')?.dataset.k);
    if (x) { at.classList.remove('q'); at.textContent = x.d; }
  }
}
// Fontet ngarkohen duke filluar nga faqja ku je; çdo faqe shfaqet kur fontet e saj janë gati.
async function qcfLoadFonts(startIdx = 0) {
  const token = R.token;
  const order = $$('#readerBody .pg.qw').sort((a, b) => Math.abs(+a.dataset.i - startIdx) - Math.abs(+b.dataset.i - startIdx));
  let i = 0;
  const worker = async () => {
    while (i < order.length) {
      const sec = order[i++];
      const ps = (sec.dataset.qp || '').split(',').filter(Boolean).map(Number);
      try { await Promise.all(ps.map((p) => qcfFace(p).load())); }
      catch {
        if (token !== R.token) return;
        qcfFallback(sec);
        if (!QCF.warned) { QCF.warned = true; toast('Disa faqe me texhvid nuk u ngarkuan (internet?). Po shfaqen me Scheherazade.', 4200); }
      }
      if (token !== R.token) return;
      sec.classList.remove('qw');
    }
  };
  await Promise.all([worker(), worker(), worker()]);
}
async function qcfPrepare(pages) {
  try { await qcfEnsure(pages); return true; }
  catch {
    if (!QCF.warned) { QCF.warned = true; toast('Fonti me texhvid nuk u ngarkua — nevojitet internet herën e parë. Po përdoret Scheherazade.', 4500); }
    return false;
  }
}

// ================================================================ lexuesi
const R = { kind: '', n: 0, pages: [], idx: 0, token: 0, io: null, lastY: 0 };
const count = () => R.pages.length;

function surahHead(su) {
  const showB = su.b && su.n !== 1 && su.n !== 9;
  return `<div class="s-head"><div class="orn"><span class="ar-name" lang="ar">${esc(su.ar)}</span></div>
    <div class="sq">${su.n}. ${esc(su.sq)} · <i>${esc(su.mn)}</i> · ${su.c} ajete</div></div>
    ${showB ? `<div class="basmala ar-txt" lang="ar">${basmala()}</div>` : ''}`;
}

function pageHTML(pg, i) {
  const info = PAGES[pg.p];
  const key = textKey();
  const qcf = key === 'q';
  const qpages = new Set();
  const OPEN = '<div class="txt">';
  let ar = OPEN;
  let tr = '';
  for (const x of pg.items) {
    if (x.a === 1) {
      ar += `</div>${surahHead(surah(x.s))}${OPEN}`;
      tr += `<h4>${x.s}. ${esc(surah(x.s).sq)} — ${esc(surah(x.s).mn)}</h4>`;
    }
    // Numri i ajetit me shifra perëndimore (1, 2, 3 …)
    const segs = qcf && qcfSegs(x);
    if (segs) for (const [p] of segs) qpages.add(p);
    const at = segs ? `<span class="at q">${qcfHTML(segs)}</span>` : `<span class="at">${esc((key !== 'q' && x[key]) || x.d)}</span>`;
    ar += `<span class="ay" data-k="${x.s}:${x.a}">${at} <span class="an">${x.a}</span></span> `;
    tr += `<p data-k="${x.s}:${x.a}"><b>${x.s}:${x.a}</b><span class="tt">${esc(plain(x.t))}</span></p>`;
  }
  ar = (ar + '</div>').replaceAll(`${OPEN}</div>`, '');
  const j = juzOfPage(pg.p);
  const inJuz = pg.p - juzMeta(j).pg[0] + 1;
  const qattr = qpages.size ? ` data-qp="${[...qpages].join(',')}"` : '';
  return `<section class="pg${qpages.size ? ' qw' : ''}" data-i="${i}" data-p="${pg.p}"${qattr}>
    <div class="pg-row">
      <div class="pg-ar ar-txt" lang="ar">${ar}</div>
      <div class="pg-tr" lang="sq"><div class="tr-in">${tr}</div></div>
    </div>
    <div class="pg-sep"><span>Faqja <b>${info.n}</b> e Mus'hafit · xhuzi ${j}, ${inJuz}/${pageCount(juzMeta(j).pg)}</span></div>
  </section>`;
}

const endHTML = () => `<div class="end card" id="endCard" data-i="${count()}"></div>`;
const renderEnd = safe(() => {
  const el = $('#endCard');
  if (!el) return;
  let html;
  if (R.kind === 'j') {
    const done = isDone(R.n);
    const next = R.n < 30 ? R.n + 1 : 1;
    html = done
      ? `<div class="big">100%</div><h3>Elhamdulilah! Xhuzi ${R.n} u përfundua</h3><p>Allahu ta pranoftë leximin dhe ta shtoftë kuptimin.</p>
         <div class="row"><button class="btn" data-act="undone" data-j="${R.n}">Anulo</button><button class="btn primary" data-act="next">Xhuzi ${next} →</button></div>`
      : `<h3>Fundi i xhuzit ${R.n}</h3><p>Mashallah, arrite deri këtu! Shënoje si të përfunduar.</p>
         <div class="row"><button class="btn gold" data-act="done" data-j="${R.n}">✓ Përfundova xhuzin ${R.n}</button></div>`;
  } else {
    const su = surah(R.n);
    const next = R.n < 114 ? surah(R.n + 1) : null;
    const isKahf = R.n === KAHF;
    const k = val(S.kf);
    const kahfDone = isKahf && k && k.w === weekKey() && k.d;
    html = `<h3>Fundi i sures ${esc(su.sq)}</h3><p>${isKahf ? 'Allahu ta bëftë dritë mes dy xhumave.' : 'Mashallah! Vazhdo me suren tjetër.'}</p>
      <div class="row">${isKahf ? (kahfDone ? '<span class="muted">✓ Kehfi u shënua për këtë xhuma</span>' : '<button class="btn gold" data-act="kahf">✓ E lexova Kehfin</button>') : ''}
      ${next ? `<button class="btn ${isKahf ? '' : 'primary'}" data-act="next">${next.n}. ${esc(next.sq)} →</button>` : ''}</div>`;
  }
  el.innerHTML = html;
});

async function loadUnit(kind, n) {
  let ayahs;
  if (kind === 'j') ayahs = (await loadJuz(n)).a;
  else {
    const su = surah(n);
    const j1 = su.j, j2 = juzOfPage(su.pg[1]);
    const parts = await Promise.all(Array.from({ length: j2 - j1 + 1 }, (_, k) => loadJuz(j1 + k)));
    ayahs = parts.flatMap((p) => p.a.filter((x) => x.s === n));
  }
  const pages = [];
  for (const x of ayahs) {
    const last = pages[pages.length - 1];
    if (last && last.p === x.p) last.items.push(x); else pages.push({ p: x.p, items: [x] });
  }
  return pages;
}

function buildReader() {
  R.io?.disconnect();
  const body = $('#readerBody');
  body.innerHTML = R.pages.map(pageHTML).join('') + endHTML();
  R.io = new IntersectionObserver((ents) => {
    for (const e of ents) if (e.isIntersecting) setIdx(+e.target.dataset.i);
  }, { rootMargin: '-35% 0px -60% 0px' });
  for (const el of $$('.pg, .end', body)) R.io.observe(el);
  renderEnd();
  decorateBm();
  requestAnimationFrame(markOverflow);
}
// Përkthimi anash (ekran i gjerë): zbehje e butë lart/poshtë kur ka tekst për të lëvizur.
function trEdges(el) {
  const ovf = el.scrollHeight > el.clientHeight + 2;
  el.classList.toggle('ovf', ovf);
  el.classList.toggle('at-top', el.scrollTop < 4);
  el.classList.toggle('at-end', el.scrollTop + el.clientHeight >= el.scrollHeight - 4);
}
const markOverflow = () => { for (const el of $$('#readerBody .tr-in')) trEdges(el); };
function rebuildReader() {
  if (!count()) return;
  const k = visibleAyah();
  const done = () => {
    buildReader();
    if (k) scrollToAyah(k, false); else goTo(R.idx, false);
    if (textKey() === 'q') qcfLoadFonts(Math.max(0, R.idx));
  };
  if (textKey() === 'q' && !qcfReady(R.pages)) { const token = R.token; qcfPrepare(R.pages).then(() => { if (token === R.token) done(); }); return; }
  done();
}
function visibleAyah() {
  const top = $('.reader-top').getBoundingClientRect().bottom + 20;
  for (const el of $$('#readerBody .ay')) if (el.getBoundingClientRect().bottom > top) return el.dataset.k;
  return null;
}

function goTo(i, smooth = true) {
  i = clamp(i, 0, count());
  const el = $(`#readerBody [data-i="${i}"]`);
  if (!el) return;
  const top = i === 0 ? 0 : el.getBoundingClientRect().top + scrollY - 70;
  scrollTo({ top: Math.max(0, top), behavior: smooth ? 'smooth' : 'instant' });
  setIdx(i);
}
function scrollToAyah(k, flash = true) {
  const el = $(`#readerBody .ay[data-k="${k}"]`);
  if (!el) return;
  const top = el.getBoundingClientRect().top + scrollY - innerHeight * 0.28;
  scrollTo({ top: Math.max(0, top), behavior: 'instant' });
  const pg = el.closest('.pg');
  if (pg) setIdx(+pg.dataset.i);
  if (flash) for (const x of $$(`#readerBody [data-k="${k}"]`)) { x.classList.remove('flash'); void x.offsetWidth; x.classList.add('flash'); }
}

function setIdx(i) {
  if (i === R.idx) return;
  R.idx = i;
  updatePill();
}

// Numëruesi: ku jam tani dhe sa faqe kam përfunduar (shënjuesi)
const updatePill = safe(() => {
  if (route.name !== 'reader' || !count()) return;
  const n = count();
  const pos = Math.min(Math.max(R.idx, 0) + 1, n);
  $('#pillPg').innerHTML = `Faqja <b>${pos}</b> / ${n}`;
  const mp = printed(R.pages[pos - 1].p);
  $('#pillMp').innerHTML = `<svg><use href="#i-book"/></svg>Mus'hafi <b>${mp}</b>`;
  $('#pillMp').title = `Faqja ${mp} e Mus'hafit`;
  const b = bmOf();
  const pr = R.kind === 'j' ? juzProgress(R.n) : surahProgress(R.n);
  const showBm = !!b && bmInUnit(b);
  $('#pillBm').hidden = !showBm && !pr.read;
  $('#pillBmTxt').textContent = `${pr.read}/${pr.count}`;
  $('#pillBar').style.width = `${pr.pct}%`;
  $('#pill').setAttribute('aria-label', `Faqja ${pos} nga ${n}, faqja ${mp} e Mus'hafit.${showBm ? ' Shko te shënjuesi.' : ''}`);
});

// ================================================================ shënjuesi = progresi
const bmOf = () => (R.kind === 'j' ? val(S.bj) : val(S.bs));
const bmInUnit = (b) => (R.kind === 'j' ? b.j === R.n : b.s === R.n);
function decorateBm() {
  for (const el of $$('#readerBody .bm')) el.classList.remove('bm');
  const b = bmOf();
  if (b && bmInUnit(b)) for (const el of $$(`#readerBody [data-k="${b.s}:${b.a}"]`)) el.classList.add('bm');
}
function toggleAyahBm(k) {
  const [s, a] = k.split(':').map(Number);
  const pg = R.pages.find((g) => g.items.some((x) => x.s === s && x.a === a));
  if (!pg) return;
  const field = R.kind === 'j' ? 'bj' : 'bs';
  const b = val(S[field]);
  if (b && b.s === s && b.a === a && bmInUnit(b)) {
    setVal(field, null);
    toast('Shënjuesi u hoq (progresi mbetet).');
  } else {
    const w = weekKey();
    // Faqet ndërmjet shënjuesit të vjetër dhe të riut numërohen si të lexuara sot
    // (lëvizja prapa e korrigjon numrin; një xhuz i përfunduar këtë javë nuk numërohet sërish).
    const before = R.kind === 'j' && isDone(R.n) ? null : unitPos(R.kind, R.n);
    if (R.kind === 'j') {
      setVal('bj', { j: R.n, s, a, p: pg.p });
      setKey('pg', R.n, { w, c: pg.p });
      keepOnly('pg', R.n);
      if (!activeJuz()) setVal('wj', { w, j: R.n });
    } else {
      setVal('bs', { s, a, p: pg.p });
      setKey('sp', s, pg.p);
      keepOnly('sp', s);
    }
    if (R.kind === 's' && s === KAHF) {
      const kf = val(S.kf);
      const last = pg.p === surah(KAHF).pg[1] && a === surah(KAHF).c;
      setVal('kf', { w, p: pg.p, ...((kf && kf.w === w && kf.d) || last ? { d: 1 } : {}) });
    }
    if (before !== null) logAdd(pg.p - before);
    updateWeekTotal();
    const pr = R.kind === 'j' ? juzProgress(R.n) : surahProgress(R.n);
    toast(`🔖 ${surah(s).sq} ${s}:${a} · ${pr.read}/${pr.count} faqe · Mus'hafi f. ${printed(pg.p)}`, 2600);
  }
  decorateBm();
  updatePill();
}

function markDone(j, on) {
  const w = weekKey();
  if (on) {
    if (!isDone(j)) logAdd(juzMeta(j).pg[1] - unitPos('j', j));
    setKey('done', j, w);
    setKey('pg', j, { w, c: juzMeta(j).pg[1] });
    keepOnly('pg', j);
    const bj = val(S.bj);
    if (bj && bj.j !== j) setVal('bj', null);
    if (!activeJuz()) setVal('wj', { w, j });
    toast(`Elhamdulilah! Xhuzi ${j} u përfundua. Allahu ta pranoftë.`, 3600);
  } else setKey('done', j, null);
  updateWeekTotal();
  renderEnd();
  updatePill();
}
function markKahf() {
  const k = val(S.kf);
  const su = surah(KAHF);
  const from = Math.max(su.pg[0] - 1, k && k.w === weekKey() ? k.p : 0, unitPos('s', KAHF));
  if (!(k && k.w === weekKey() && k.d)) logAdd(su.pg[1] - from);
  setVal('kf', { w: weekKey(), p: surah(KAHF).pg[1], d: 1 });
  updateWeekTotal();
  toast('Allahu ta pranoftë! Kehfi u shënua për këtë xhuma.', 3200);
  renderEnd();
  updatePill();
}

async function openReader(kind, n, target) {
  $('#home').hidden = true;
  $('#reader').hidden = false;
  $('#reader').classList.remove('hide-bars');
  $('#reader').dataset.kind = kind; // ngjyra e shënjuesit: ari për xhuzin, blu për suret
  const token = ++R.token;
  if (kind === 'j') {
    const jm = juzMeta(n);
    $('#rTitle').textContent = `Xhuzi ${n}${activeJuz() === n ? (activeWeekNo() > 1 ? ` · java e ${ordinal(activeWeekNo())}` : ' · kjo javë') : ''}`;
    $('#rSub').textContent = `${surah(jm.s[0]).sq} ${jm.s.join(':')} – ${surah(jm.e[0]).sq} ${jm.e.join(':')} · ${pageCount(jm.pg)} faqe`;
  } else {
    const su = surah(n);
    $('#rTitle').textContent = `${n}. ${su.sq} — ${su.mn}`;
    $('#rSub').textContent = `${su.c} ajete · ${su.r === 'M' ? 'Medinase' : 'Mekase'} · ${pageCount(su.pg)} faqe`;
  }
  $('#readerBody').innerHTML = '<div class="loading">Duke ngarkuar…</div>';
  $('#pillPg').textContent = '';
  let pages;
  try { pages = await loadUnit(kind, n); } catch {
    if (token === R.token) $('#readerBody').innerHTML = '<div class="loading">Teksti nuk u ngarkua. Kontrollo lidhjen dhe provo përsëri.</div>';
    return;
  }
  if (token !== R.token) return;
  const qcf = textKey() === 'q' && (await qcfPrepare(pages));
  if (token !== R.token) return;
  Object.assign(R, { kind, n, pages, idx: -1 });
  // Objektivi: ajeti nga lidhja, përndryshe shënjuesi i kësaj njësie, përndryshe fillimi.
  let ayah = target && target.includes(':') ? target : null;
  if (!ayah) { const b = bmOf(); if (b && bmInUnit(b)) ayah = `${b.s}:${b.a}`; }
  let ti = 0;
  if (ayah) { const [s, a] = ayah.split(':').map(Number); ti = Math.max(0, pages.findIndex((g) => g.items.some((x) => x.s === s && x.a === a))); }
  if (qcf) {
    // Fontet e faqes ku do të hapet ngarkohen para shfaqjes, që faqja të mos lëvizë pasi del.
    const ps = new Set();
    for (const x of pages[ti].items) for (const [p] of qcfSegs(x) || []) ps.add(p);
    await Promise.race([Promise.all([...ps].map((p) => qcfFace(p).load())).catch(() => {}), new Promise((r) => setTimeout(r, 6000))]);
    if (token !== R.token) return;
  }
  buildReader();
  scrollTo(0, 0);
  setIdx(0);
  requestAnimationFrame(() => { if (token === R.token && ayah) scrollToAyah(ayah, !!target); });
  if (qcf) qcfLoadFonts(ti);
}

// ================================================================ sinkronizimi (UI)
const renderSync = safe(() => {
  $('#myCode').textContent = fmtCode(sync.code);
  const img = $('#qrImg');
  const src = `/api/qr?code=${sync.code}`;
  if (img.getAttribute('src') !== src) { img.hidden = false; img.src = src; }
  $('#iosHint').hidden = !isIOS;
  const list = Object.entries(S.dv).filter(([, e]) => val(e)).map(([id, e]) => ({ id, ...val(e) }))
    .sort((a, b) => (b.id === DEV_ID) - (a.id === DEV_ID) || b.l - a.l);
  if (!list.some((d) => d.id === DEV_ID)) list.unshift({ id: DEV_ID, n: deviceName(), l: Date.now() });
  $('#deviceList').innerHTML = list.map((d) => {
    const me = d.id === DEV_ID;
    return `<li><span class="dv-ic"><svg><use href="#${/iPhone|iPad|Android/.test(d.n) ? 'i-phone' : 'i-laptop'}"/></svg></span>
      <span class="dv-t"><strong>${esc(d.n)}</strong><span>${me ? 'Kjo pajisje' : `Aktive ${ago(d.l)}`}</span></span>
      ${me ? '<span class="tag">Kjo</span>' : `<button class="icon-btn" data-forget="${d.id}" aria-label="Hiqe nga lista"><svg><use href="#i-close"/></svg></button>`}</li>`;
  }).join('') + (list.length === 1 ? '<li class="empty">Ende asnjë pajisje tjetër — shto një më poshtë.</li>' : '');
  renderSyncStatus();
});
function renderSyncStatus() {
  const hero = $('#syncHero');
  if (!hero) return;
  const others = Object.entries(S.dv).filter(([id, e]) => id !== DEV_ID && val(e)).length;
  const time = sync.lastOk ? new Date(sync.lastOk).toLocaleTimeString('sq-AL', { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
  const [title, text] = {
    idle: ['Duke u lidhur…', ''],
    busy: ['Duke sinkronizuar…', 'Një çast'],
    ok: [others ? 'Sinkronizuar' : 'Gati për sinkronizim', `Përditësuar ${time}${others ? ` · ${others + 1} pajisje` : ''}`],
    offline: ['Pa internet', 'Ndryshimet ruhen dhe dërgohen vetë më vonë.'],
    error: ['Sinkronizimi dështoi', 'Do të provohet vetë pas një minute.'],
    off: ['Vetëm në këtë pajisje', 'Sinkronizimi nuk është aktiv në server.'],
  }[sync.status] || ['', ''];
  hero.dataset.s = sync.status;
  $('#syncTitleText').textContent = title;
  $('#syncText').textContent = text;
  $('#retryBtn').hidden = !['error', 'offline', 'off'].includes(sync.status);
}
async function shareLink() {
  const url = `${location.origin}/?k=${sync.code}`;
  if (navigator.share) {
    try { await navigator.share({ title: 'JUZ', text: 'Hape këtë lidhje për të lidhur leximin në JUZ:', url }); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  try { await navigator.clipboard.writeText(url); toast('Lidhja u kopjua'); } catch { prompt('Kopjo lidhjen:', url); }
}
function tryJoin(raw) {
  const code = extractCode(raw);
  const err = $('#joinErr');
  err.hidden = true;
  if (!CODE_RE.test(code)) { err.textContent = 'Kodi ka 10 shkronja dhe shifra, p.sh. ABCDE-23456.'; err.hidden = false; return; }
  if (code === sync.code) { err.textContent = 'Ky është kodi i kësaj pajisjeje — shkruaje në pajisjen tjetër.'; err.hidden = false; return; }
  if (!confirm(`Ta lidh këtë pajisje me ${fmtCode(code)}?\n\nShënjuesit dhe progresi i të dyja pajisjeve bashkohen; asgjë nuk fshihet.`)) return;
  $('#joinInput').value = '';
  useCode(code, `U lidhët me ${fmtCode(code)}`);
}
function renderAbout() {
  if (META.tr?.version) $('#trVersion').textContent = META.tr.version;
  const v = $('#aboutVersion');
  v.textContent = `Të dhënat: ${META.built}`;
  if ('caches' in window) caches.keys().then((ks) => { const k = ks.find((x) => x.startsWith('juz-')); if (k) v.textContent = `Versioni: ${k} · Të dhënat: ${META.built}`; }).catch(() => {});
}

// ================================================================ përkthimi i një ajeti (gishti i mbajtur)
function showAyah(k) {
  const x = ayahItem(k);
  if (!x) return;
  const su = surah(x.s);
  const sheet = $('#sheet-ayah');
  sheet.dataset.k = k;
  $('#ayTitle').textContent = `${su.sq} ${x.s}:${x.a}`;
  $('#aySub').textContent = `${su.mn} · Mus'hafi f. ${printed(x.p)}`;
  const ar = $('#ayAr');
  const src = $(`#readerBody .ay[data-k="${k}"] .at`);
  if (src && src.classList.contains('q')) { ar.innerHTML = src.innerHTML; ar.className = 'ay-ar ar-txt q'; }
  else { ar.textContent = (textKey() === 'h' && x.h) || x.d; ar.className = 'ay-ar ar-txt'; }
  $('#ayTr').textContent = plain(x.t);
  const b = bmOf();
  const on = b && bmInUnit(b) && `${b.s}:${b.a}` === k;
  $('#ayBm').innerHTML = `<svg><use href="#i-bm"/></svg> ${on ? 'Hiqe shënjuesin' : 'Shëno këtu'}`;
  $('#ayPrev').disabled = !ayahNear(k, -1);
  $('#ayNext').disabled = !ayahNear(k, 1);
  if ($('#sheet-ayah').hidden) openSheet('ayah');
}
// ajeti para/pas këtij, brenda asaj që po lexohet (xhuzi ose surja)
function ayahNear(k, d) {
  const all = R.pages.flatMap((pg) => pg.items);
  const i = all.findIndex((x) => `${x.s}:${x.a}` === k);
  const x = i < 0 ? null : all[i + d];
  return x ? `${x.s}:${x.a}` : null;
}
function stepAyah(d) {
  const k = ayahNear($('#sheet-ayah').dataset.k, d);
  if (!k) return;
  showAyah(k);
  $('#sheet-ayah').scrollTop = 0;
}
// A− / A+ gjatë leximit: arabishtja me 2, përkthimi me 1; ajeti në krye të ekranit mbetet aty
function stepSize(d) {
  const size = clamp(settings.size + 2 * d, 22, 50), tr = clamp(settings.trSize + d, 14, 26);
  if (size === settings.size && tr === settings.trSize) return;
  const k = visibleAyah();
  const el = k && $(`#readerBody .ay[data-k="${k}"]`);
  const before = el ? el.getBoundingClientRect().top : 0;
  settings.size = size; settings.trSize = tr;
  saveSettings(); applySettings();
  $('#sizeRange').value = size; $('#trSizeRange').value = tr;
  if (el) scrollBy({ top: el.getBoundingClientRect().top - before, behavior: 'instant' });
}

// ================================================================ koha e leximit
// Matet vetëm kur lexuesi është i hapur, ekrani i dukshëm dhe ka pasur lëvizje/prekje në 6 minutat e fundit.
const GRACE_MS = 90000; // kur del pa prekur asgjë, numërohen vetëm 90 sekondat e para pas prekjes së fundit
const RT = { acc: 0, last: Date.now(), act: Date.now(), vis: document.visibilityState === 'visible', since: 0, idle: false };
function accrue() {
  const now = Date.now();
  const dt = Math.min(now, RT.act + IDLE_MS) - RT.last;
  RT.last = now;
  if (route.name === 'reader' && RT.vis && dt > 0 && dt < 90000) { RT.acc += dt; RT.since += dt; }
  if (!RT.idle && now - RT.act >= IDLE_MS) {
    // Pa lëvizje për 6 min: koha pas 90 sekondave të para nuk ishte lexim.
    RT.idle = true;
    RT.acc -= Math.max(0, RT.since - GRACE_MS);
    RT.since = 0;
    if (RT.acc < 0) { logAdd(0, RT.acc / 1000); RT.acc = 0; }
  }
}
function flushReading() {
  accrue();
  if (RT.acc < 5000) return;
  const s = RT.acc / 1000;
  RT.acc = 0;
  logAdd(0, s);
}
function startReadingClock() {
  const mark = () => { const now = Date.now(); if (RT.idle) { RT.idle = false; RT.last = now; } RT.act = now; RT.since = 0; };
  for (const ev of ['scroll', 'pointerdown', 'keydown', 'wheel', 'touchstart']) addEventListener(ev, mark, { passive: true, capture: true });
  setInterval(() => { accrue(); if (RT.acc >= 90000) flushReading(); }, 15000);
  document.addEventListener('visibilitychange', () => {
    accrue();
    RT.vis = document.visibilityState === 'visible';
    if (!RT.vis) flushReading();
  });
  addEventListener('pagehide', flushReading);
}

// ================================================================ kyçja e rrotullimit (telefon/tablet)
// Si parazgjedhje aplikacioni ndjek cilësimin e telefonit (Rrotullimi automatik).
// Butoni e kyç vetëm për këtë herë; kur aplikacioni hapet përsëri, vendos sërish telefoni.
const ROT = { on: false, fs: false };
const canRotate = () => !isIOS && !!screen.orientation?.lock && matchMedia('(pointer: coarse)').matches;
async function tryLock() {
  try { await screen.orientation.lock(screen.orientation.type); return true; } catch { return false; }
}
function renderRot() {
  const show = canRotate();
  $('#rotRow').hidden = !show;
  if (!show) return;
  $('#rotToggle').checked = ROT.on;
}
async function setRotLock(on, quiet = false) {
  if (!on) {
    ROT.on = false;
    try { screen.orientation.unlock(); } catch {}
    if (ROT.fs && document.fullscreenElement) { ROT.fs = false; document.exitFullscreen().catch(() => {}); }
    renderRot();
    if (!quiet) toast('Rrotullimi ndjek përsëri cilësimin e telefonit');
    return;
  }
  let ok = await tryLock();
  // Në shfletues (jo si aplikacion i instaluar) kyçja lejohet vetëm në ekran të plotë.
  if (!ok && !quiet && !isStandalone() && document.documentElement.requestFullscreen) {
    try { await document.documentElement.requestFullscreen({ navigationUI: 'hide' }); ROT.fs = true; ok = await tryLock(); } catch {}
    if (!ok && ROT.fs) { ROT.fs = false; document.exitFullscreen().catch(() => {}); }
  }
  ROT.on = ok;
  renderRot();
  if (quiet) return;
  if (ok) toast(screen.orientation.type.startsWith('portrait') ? 'U kyç vertikalisht për këtë herë' : 'U kyç horizontalisht për këtë herë');
  else toast('Telefoni nuk e lejoi kyçjen këtu. Shto JUZ në ekranin kryesor dhe provo nga aplikacioni.', 4500);
}
function initRot() {
  lsSet(LS.rot, null); // kyçja e ruajtur nga versioni 7.0.0 nuk vendoset më vetë
  renderRot();
  document.addEventListener('fullscreenchange', () => {
    // Kur del nga ekrani i plotë, shfletuesi e heq kyçjen.
    if (!document.fullscreenElement && ROT.fs) { ROT.fs = false; ROT.on = false; renderRot(); }
  });
}

// ================================================================ sfondi i letrës
function buildPaperGrid() {
  const g = $('#paperGrid');
  if (g.childElementCount || !window.JUZPaper) return;
  const P = window.JUZPaper;
  g.innerHTML = P.DESIGNS.map((d) => `<button type="button" role="radio" data-paper="${d}" aria-checked="false"><i class="pp"></i><span>${esc(P.NAMES[d])}</span></button>`).join('');
  for (const b of $$('button', g)) P.swatch($('.pp', b), b.dataset.paper);
  applySettings();
}

// ================================================================ rruga
const route = { name: '' };
let cameFromHome = false;
let pendingFromHome = false;
function navigate(hash) { if (location.hash === hash) handleRoute(); else location.hash = hash; }
const handleRoute = safe(() => {
  const h = location.hash.replace(/^#\/?/, '');
  const m = h.match(/^([js])\/(\d{1,3})(?:\/(\d{1,3}:\d{1,3}))?/);
  flushReading(); // koha e lexuar deri tani i përket faqes së mëparshme
  closeSheet(true);
  if (m && ((m[1] === 'j' && +m[2] >= 1 && +m[2] <= 30) || (m[1] === 's' && +m[2] >= 1 && +m[2] <= 114))) {
    cameFromHome = pendingFromHome && route.name === 'home';
    pendingFromHome = false;
    route.name = 'reader';
    openReader(m[1], +m[2], m[3] || null);
  } else {
    route.name = 'home';
    R.token++;
    R.io?.disconnect();
    $('#reader').hidden = true;
    $('#home').hidden = false;
    renderHome();
    scrollTo(0, 0);
  }
});

// ================================================================ ngjarjet
function bind() {
  document.addEventListener('click', (e) => {
    const open = e.target.closest('[data-open]');
    if (open) return openSheet(open.dataset.open);
    if (e.target.closest('[data-close]') || e.target === $('#scrim')) return closeSheet();
    const as = e.target.closest('[data-assign]');
    if (as) {
      const j = +as.dataset.assign;
      assignWeek(j);
      if (as.classList.contains('w-go')) { pendingFromHome = true; navigate(`#/j/${j}`); }
      return;
    }
    const link = e.target.closest('[data-link]');
    if (link) { pendingFromHome = route.name === 'home'; navigate(link.dataset.link); }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });

  for (const t of $$('[data-home]')) t.addEventListener('click', () => { settings.home = t.dataset.home; saveSettings(); renderHome(); });
  $('#weekCard').addEventListener('click', (e) => {
    if (!e.target.closest('[data-focus-search]')) return;
    const s = $('#surahSearch');
    s.scrollIntoView({ block: 'center', behavior: 'smooth' });
    s.focus({ preventScroll: true });
  });
  $('#surahSearch').addEventListener('input', safe(renderSurahList));
  $('#juzGrid').addEventListener('click', (e) => {
    const b = e.target.closest('[data-j]');
    if (b) { pendingFromHome = true; navigate(`#/j/${b.dataset.j}`); }
  });
  $('#surahList').addEventListener('click', (e) => {
    const b = e.target.closest('[data-s]');
    if (b) { pendingFromHome = true; navigate(`#/s/${b.dataset.s}`); }
  });
  $('#backBtn').addEventListener('click', () => {
    if (cameFromHome && history.length > 1) { cameFromHome = false; history.back(); } else location.replace('#/');
  });
  for (const b of $$('[data-night]')) b.addEventListener('click', () => setSetting('bg', settings.bg === 'night' ? 'paper' : 'night'));
  $('#pill').addEventListener('click', () => {
    const b = bmOf();
    if (b && bmInUnit(b)) scrollToAyah(`${b.s}:${b.a}`);
    else toast('Prek një ajet për ta shënuar — kështu ruhet progresi.');
  });

  // Mbaj gishtin mbi një ajet (ose kliko me të djathtën): përkthimi shqip i atij ajeti.
  const LP = { t: 0, x: 0, y: 0, fired: false };
  const body = $('#readerBody');
  body.addEventListener('pointerdown', (e) => {
    LP.fired = false;
    clearTimeout(LP.t);
    if (!settings.hold || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const el = e.target.closest('.ay, .pg-tr p[data-k]');
    if (!el) return;
    LP.x = e.clientX; LP.y = e.clientY;
    LP.t = setTimeout(() => { LP.fired = true; try { navigator.vibrate?.(12); } catch {} showAyah(el.dataset.k); }, 480);
  });
  body.addEventListener('pointermove', (e) => { if (Math.hypot(e.clientX - LP.x, e.clientY - LP.y) > 10) clearTimeout(LP.t); });
  for (const ev of ['pointerup', 'pointercancel']) body.addEventListener(ev, () => clearTimeout(LP.t));
  addEventListener('scroll', () => clearTimeout(LP.t), { passive: true });
  body.addEventListener('contextmenu', (e) => {
    const el = e.target.closest('.ay, .pg-tr p[data-k]');
    if (!el || !settings.hold) return;
    e.preventDefault();
    if (!LP.fired) { LP.fired = true; showAyah(el.dataset.k); }
  });

  $('#readerBody').addEventListener('click', safe((e) => {
    if (LP.fired) { LP.fired = false; return; } // gishti i mbajtur hapi përkthimin; mos e shëno ajetin
    const act = e.target.closest('[data-act]');
    if (act) {
      const a = act.dataset.act;
      if (a === 'done') markDone(+act.dataset.j, true);
      if (a === 'undone') markDone(+act.dataset.j, false);
      if (a === 'kahf') markKahf();
      if (a === 'next') navigate(R.kind === 's' ? `#/s/${R.n + 1}` : `#/j/${R.n < 30 ? R.n + 1 : 1}`);
      return;
    }
    if (String(getSelection?.() || '').length) return;
    const ay = e.target.closest('[data-k]');
    if (ay) toggleAyahBm(ay.dataset.k);
  }));
  // Shiriti i sipërm fshihet kur lexon poshtë dhe del kur kthehesh lart.
  addEventListener('scroll', () => {
    if (route.name !== 'reader') return;
    const y = scrollY;
    const dy = y - R.lastY;
    if (Math.abs(dy) < 6) return;
    $('#reader').classList.toggle('hide-bars', dy > 0 && y > 160);
    R.lastY = y;
  }, { passive: true });

  // cilësimet
  for (const seg of $$('[data-setting]')) seg.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b) setSetting(seg.dataset.setting, /^\d+$/.test(b.dataset.v) ? +b.dataset.v : b.dataset.v);
  });
  $('#transToggle').addEventListener('change', (e) => setSetting('trans', e.target.checked));
  $('#holdToggle').addEventListener('change', (e) => { settings.hold = e.target.checked; saveSettings(); applySettings(); });
  $('#ayBm').addEventListener('click', () => { const k = $('#sheet-ayah').dataset.k; closeSheet(true); if (k) toggleAyahBm(k); });
  $('#ayCopy').addEventListener('click', async () => {
    const x = ayahItem($('#sheet-ayah').dataset.k);
    if (!x) return;
    const txt = `${x.d}\n\n${plain(x.t)}\n— ${surah(x.s).sq} ${x.s}:${x.a} (Hassan Nahi)`;
    try { await navigator.clipboard.writeText(txt); toast('Ajeti u kopjua'); } catch { prompt('Kopjo:', txt); }
  });
  $('#sizeRange').addEventListener('input', (e) => { settings.size = +e.target.value; saveSettings(); applySettings(); });
  $('#trSizeRange').addEventListener('input', (e) => { settings.trSize = +e.target.value; saveSettings(); applySettings(); });
  $('#arTransRange').addEventListener('input', (e) => { settings.arTrans = +e.target.value; saveSettings(); applySettings(); });
  $('#trTransRange').addEventListener('input', (e) => { settings.trTrans = +e.target.value; saveSettings(); applySettings(); });
  $('#paperGrid').addEventListener('click', (e) => { const b = e.target.closest('[data-paper]'); if (b) setSetting('paper', b.dataset.paper); });

  // rrotullimi
  // A− / A+ dhe ajeti para/pas
  $('#fszDown').addEventListener('click', () => stepSize(-1));
  $('#fszUp').addEventListener('click', () => stepSize(1));
  $('#ayPrev').addEventListener('click', () => stepAyah(-1));
  $('#ayNext').addEventListener('click', () => stepAyah(1));
  {
    let sx = 0, sy = 0, on = false;
    const sh = $('#sheet-ayah');
    sh.addEventListener('touchstart', (e) => { const t = e.touches[0]; sx = t.clientX; sy = t.clientY; on = e.touches.length === 1; }, { passive: true });
    sh.addEventListener('touchend', (e) => {
      if (!on) return;
      on = false;
      const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) stepAyah(dx < 0 ? 1 : -1);
    }, { passive: true });
  }
  $('#rotToggle').addEventListener('change', (e) => setRotLock(e.target.checked));

  // statistikat
  $('#mPrev').addEventListener('click', () => { if (--statView.m < 0) { statView.m = 11; statView.y--; } renderStatsSheet(); });
  $('#mNext').addEventListener('click', () => { if (++statView.m > 11) { statView.m = 0; statView.y++; } renderStatsSheet(); });

  // përkthimi anash: zbehja lart/poshtë
  $('#readerBody').addEventListener('scroll', (e) => { if (e.target.classList?.contains('tr-in')) trEdges(e.target); }, { capture: true, passive: true });
  let rz;
  addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (route.name === 'reader') markOverflow(); }, 200); });

  // pajisjet
  $('#shareBtn').addEventListener('click', shareLink);
  $('#copyCodeBtn').addEventListener('click', async () => { try { await navigator.clipboard.writeText(fmtCode(sync.code)); toast('Kodi u kopjua'); } catch { prompt('Kodi:', fmtCode(sync.code)); } });
  $('#joinForm').addEventListener('submit', (e) => { e.preventDefault(); tryJoin($('#joinInput').value); });
  $('#joinInput').addEventListener('input', (e) => {
    const c = extractCode(e.target.value).slice(0, 10);
    e.target.value = c.length > 5 ? `${c.slice(0, 5)}-${c.slice(5)}` : c;
  });
  $('#retryBtn').addEventListener('click', () => { sync.backoffUntil = 0; setStatus('busy'); push(true).then(pull); });
  $('#qrImg').addEventListener('error', (e) => { e.target.hidden = true; });
  $('#deviceList').addEventListener('click', (e) => { const b = e.target.closest('[data-forget]'); if (b) { setKey('dv', b.dataset.forget, null); renderSync(); } });
  $('#newCodeBtn').addEventListener('click', () => {
    if (!confirm('Kjo pajisje do të shkëputet nga pajisjet e tjera dhe do të marrë një kod të ri. Të dhënat këtu mbeten. Vazhdo?')) return;
    useCode(newCode(), 'Pajisja u shkëput');
  });
  addEventListener('hashchange', handleRoute);
}

// Përditësimet: versioni i ri merret në sfond; aplikacioni rifreskohet vetë kur je në ballinë.
function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  const had = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('/sw.js').then((reg) => {
    setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
  }).catch(() => {});
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!had || reloaded) return;
    if (route.name === 'home' && !openSheetEl) { reloaded = true; location.reload(); }
    else toast('Versioni i ri i JUZ është gati.', 0, { label: 'Rifresko', fn: () => location.reload() });
  });
}

async function main() {
  addEventListener('unhandledrejection', (e) => console.warn('JUZ:', e.reason));
  bind();
  if (val(S.st)) { Object.assign(settings, val(S.st)); normalizeSettings(); }
  applySettings();
  if (settings.font === 'hamdullah') checkHamdullah();
  try {
    [META, PAGES] = await Promise.all([fetch('/data/meta.json').then((r) => r.json()), fetch('/data/pages.json').then((r) => r.json())]);
  } catch {
    document.body.innerHTML = '<p class="loading">JUZ nuk u ngarkua. Lidhu me internetin një herë që aplikacioni të ruhet për përdorim pa internet.</p>';
    return;
  }
  handleRoute();
  startSync();
  startReadingClock();
  initRot();
  registerSW();
}
main();
