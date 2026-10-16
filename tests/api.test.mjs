// Teste për logjikën e bashkimit dhe të dy funksionet API me një Redis të rremë.
//   npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { SCHEMA, lww, mergeDoc, sanitize } from '../public/merge.js';

// ---- Redis i rremë (imiton Upstash REST: POST <url> me trup ["CMD", ...args]) ----
const db = new Map();
let commands = 0;
process.env.KV_REST_API_URL = 'https://fake-upstash.test';
process.env.KV_REST_API_TOKEN = 'secret';
let fontMode = 'ok';
globalThis.fetch = async (url, opts) => {
  if (String(url).includes('diyanet.gov.tr')) {
    if (fontMode === 'down') return new Response('nope', { status: 503 });
    const buf = Buffer.alloc(40000); buf.writeUInt32BE(0x00010000, 0);
    return new Response(buf, { status: 200 });
  }
  if (String(url).startsWith('https://api.quran.com/')) return quranApi(String(url));
  if (String(url).includes('quran.foundation') || String(url).includes('tarteel.ai')) {
    if (fontMode === 'down') return new Response('nope', { status: 503 });
    const buf = Buffer.alloc(5000); buf.write('wOF2', 0, 'latin1');
    return new Response(buf, { status: 200 });
  }
  if (url === 'https://fake-upstash.test/pipeline') {
    const cmds = JSON.parse(opts.body);
    for (const [c, k, v, ex] of cmds) { assert.equal(c, 'SET'); assert.equal(ex, 'EX'); db.set(k, v); }
    return new Response(JSON.stringify(cmds.map(() => ({ result: 'OK' }))), { status: 200 });
  }
  assert.equal(url, 'https://fake-upstash.test');
  assert.equal(opts.headers.Authorization, 'Bearer secret');
  const [cmd, ...args] = JSON.parse(opts.body);
  commands++;
  let result;
  if (cmd === 'GET') result = db.has(args[0]) ? db.get(args[0]) : null;
  else if (cmd === 'MGET') result = args.map((k) => (db.has(k) ? db.get(k) : null));
  else if (cmd === 'SET') {
    assert.equal(args[2], 'EX');
    db.set(args[0], args[1]);
    result = 'OK';
  } else return new Response(JSON.stringify({ error: 'unknown' }), { status: 400 });
  return new Response(JSON.stringify({ result }), { status: 200 });
};

// quran.com i rremë: sureja 112 me 4 ajete në dy "faqe" të API-së (2 ajete secila); ajeti 4 kalon në faqen 605 të rreme
let quranCalls = 0;
function quranApi(url) {
  quranCalls++;
  const u = new URL(url);
  const sn = +u.pathname.split('/').pop();
  if (sn !== 112) {
    // sure të tjera: ajete me një fjalë, për testin e kufirit të thirrjeve
    const per = 50, page = +u.searchParams.get('page'), total = [0, 7, 286, 200][sn] || 3;
    const verses = Array.from({ length: Math.min(per, total - (page - 1) * per) }, (_, i) => ({ verse_number: (page - 1) * per + i + 1, page_number: 1, words: [{ char_type_name: 'word', code_v2: 'ﱁ', page_number: 1 }] }));
    return new Response(JSON.stringify({ verses, pagination: { per_page: per, current_page: page, total_pages: Math.ceil(total / per), total_records: total } }), { status: 200 });
  }
  assert.equal(u.searchParams.get('mushaf'), '19');
  const page = +u.searchParams.get('page');
  const w = (n, code, pg, type = 'word') => ({ char_type_name: type, code_v2: code, page_number: pg, position: n });
  const verse = (a) => ({ verse_number: a, page_number: 604, words: a === 4
    ? [w(1, 'ﱁ', 604), w(2, 'ﱂﱃ', 605), w(3, 'ﱄ', 605, 'end')]
    : [w(1, 'ﰀ', 604), w(2, 'ﰁ', 604), w(3, 'ﰂ', 604, 'end')] });
  const verses = page === 1 ? [verse(1), verse(2)] : [verse(3), verse(4)];
  return new Response(JSON.stringify({ verses, pagination: { per_page: 2, current_page: page, total_pages: 2, total_records: 4 } }), { status: 200 });
}
const { GET: qcfText } = await import('../api/qcf-text.js');
const { GET: qcfFont } = await import('../api/qcf-font.js');
const { default: sync } = await import('../api/sync.js');
const { default: qr } = await import('../api/qr.js');
const { default: font } = await import('../api/font.js');

function call(handler, { method = 'GET', url, body, raw = false }) {
  const req = raw
    ? Object.assign(Readable.from([Buffer.from(JSON.stringify(body))]), { method, url, headers: {} })
    : { method, url, headers: { host: 'juz.test' }, body };
  return new Promise((resolve) => {
    const res = {
      statusCode: 200, headers: {},
      setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
      end(b) { resolve({ status: this.statusCode, headers: this.headers, body: b ? (this.headers['content-type']?.includes('json') ? JSON.parse(b) : b) : undefined }); },
    };
    handler(req, res);
  });
}

const CODE = 'ABCDE23456';

// ---------------- merge ----------------
test('lww: më i riu fiton, barazimi është determinist', () => {
  assert.deepEqual(lww([1, 'a'], [2, 'b']), [2, 'b']);
  assert.deepEqual(lww([3, 'a'], [2, 'b']), [3, 'a']);
  assert.deepEqual(lww([5, 'a'], [5, 'b']), lww([5, 'b'], [5, 'a']));
  assert.deepEqual(lww(undefined, [1, 'x']), [1, 'x']);
  assert.deepEqual(lww([1, 'x'], 'junk'), [1, 'x']);
});

test('mergeDoc: për çelës, varret (null) fitojnë kur janë më të reja', () => {
  const a = { wj: [10, { w: '2026-W41', j: 3 }], sp: { 1: [10, 5], 2: [10, 7] } };
  const b = { wj: [20, { w: '2026-W41', j: 4 }], sp: { 1: [30, null], 3: [5, 1] } };
  const m = mergeDoc(a, b, SCHEMA.sync);
  assert.deepEqual(m, { wj: [20, { w: '2026-W41', j: 4 }], sp: { 1: [30, null], 2: [10, 7], 3: [5, 1] } });
  const m2 = mergeDoc({ sp: { 1: [40, 9] } }, m, SCHEMA.sync);
  assert.deepEqual(m2.sp['1'], [40, 9]);
});

test('mergeDoc: komutativ, asociativ, idempotent', () => {
  const rnd = (seed) => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
  const r = rnd(42);
  const doc = () => {
    const d = { pg: {}, sp: {}, bj: [Math.floor(r() * 10), { j: 1 + Math.floor(r() * 30), p: 1 + Math.floor(r() * 600) }] };
    for (let i = 0; i < 30; i++) {
      d.pg[String(1 + Math.floor(r() * 5))] = [Math.floor(r() * 10), r() < 0.3 ? null : { w: '2026-W41', c: 1 + Math.floor(r() * 9), m: 9 }];
      d.sp[String(1 + Math.floor(r() * 5))] = [Math.floor(r() * 10), r() < 0.3 ? null : 1 + Math.floor(r() * 9)];
    }
    return d;
  };
  for (let n = 0; n < 200; n++) {
    const a = doc(), b = doc(), c = doc(), S = SCHEMA.sync;
    assert.deepEqual(mergeDoc(a, b, S), mergeDoc(b, a, S));
    assert.deepEqual(mergeDoc(mergeDoc(a, b, S), c, S), mergeDoc(a, mergeDoc(b, c, S), S));
    const ab = mergeDoc(a, b, S);
    assert.deepEqual(mergeDoc(ab, ab, S), ab);
  }
});

test('sanitize: hedh fushat e panjohura dhe vlerat e pavlefshme (edhe ato të versioneve të vjetra)', () => {
  const now = 1_000_000_000_000;
  const s = sanitize({
    wj: [1, { w: '2026-W41', j: 31 }], hack: [1, 1], bm: [2, { j: 5, i: 3 }], pos: { 1: [1, 2] }, marks: { '2:5': [1, { c: 1 }] },
    last: [3, { k: 1, n: 36, p: 440, x: 1 }], kf: [3, { w: '2026-W41', p: 300, d: 1, x: 2 }], bj: [4, { j: 3, s: 2, a: 255, p: 45 }], bs: [4, { s: 200, a: 1, p: 1 }],
    pg: { 3: [5, { w: '2026-W41', c: 45, m: 50 }], 4: [5, { w: 'week', c: 1, m: 1 }], abc: [5, { w: '2026-W41', c: 1, m: 1 }] },
    sp: { 36: [6, 440], 37: [6, 9999] },
    done: { 4: [now + 9e10, '2026-W41'], 5: [1, 'week'] },
    wk: { '2026-W41': [7, 20], bad: [7, 3] },
  }, SCHEMA.sync, now);
  assert.deepEqual(s, {
    kf: [3, { w: '2026-W41', p: 300, d: 1 }],
    bj: [4, { j: 3, s: 2, a: 255, p: 45 }],
    pg: { 3: [5, { w: '2026-W41', c: 45 }] },
    sp: { 36: [6, 440] },
    done: { 4: [now + 86400000, '2026-W41'] },
    wk: { '2026-W41': [7, 20] },
  });
});

test('sanitize: cilësimet (st) dhe pajisjet (dv)', () => {
  const now = 1_000_000_000_000;
  const s = sanitize({
    st: [5, { bg: 'night', font: 'hamdullah', weight: 600, flow: 'flip', latin: 'lora', size: 44, evil: '<x>', script: 'medina' }],
    dv: { abcd2345: [6, { n: 'iPhone · Aplikacioni JUZ', l: 7, x: 1 }], 'BAD-ID!': [6, { n: 'x', l: 1 }], zzzz9999: [6, null] },
  }, SCHEMA.sync, now);
  assert.deepEqual(s.st, [5, { bg: 'night', font: 'hamdullah', weight: 600, latin: 'lora' }]);
  assert.deepEqual(s.dv, { abcd2345: [6, { n: 'iPhone · Aplikacioni JUZ', l: 7 }], zzzz9999: [6, null] });
  // cilësimet e vjetra (sfonde të hequra) nuk kalojnë
  assert.deepEqual(sanitize({ st: [1, { bg: 'rough', weight: 900 }] }, SCHEMA.sync, now).st, [1, {}]);
  // v7: fontet për fillestarë dhe sfondi i letrës
  assert.deepEqual(sanitize({ st: [2, { font: 'kufi', paper: 'washi' }] }, SCHEMA.sync, now).st, [2, { font: 'kufi', paper: 'washi' }]);
  assert.deepEqual(sanitize({ st: [2, { font: 'comic', paper: 'gold' }] }, SCHEMA.sync, now).st, [2, {}]);
});

test('sanitize: ditari i leximit (dl) — faqe dhe sekonda për ditë e pajisje', () => {
  const now = 1_000_000_000_000;
  const s = sanitize({
    dl: {
      '2026-10-16.abcd2345': [5, { p: 12, t: 1500, x: 1 }],
      '2026-10-16.BAD': [5, { p: 1, t: 1 }],
      '2026-10-15.abcd2345': [5, { p: -3, t: 10 }],
      '2026-10-14.abcd2345': [5, { p: 2, t: 999999 }],
      '2026-10-13.wxyz6789': [5, null],
    },
  }, SCHEMA.sync, now);
  assert.deepEqual(s.dl, { '2026-10-16.abcd2345': [5, { p: 12, t: 1500 }], '2026-10-13.wxyz6789': [5, null] });
  // dy pajisje të njëjtën ditë nuk e mbishkruajnë njëra-tjetrën
  const a = { dl: { '2026-10-16.aaaa2222': [1, { p: 3, t: 60 }] } };
  const b = { dl: { '2026-10-16.bbbb3333': [2, { p: 4, t: 90 }] } };
  assert.equal(Object.keys(mergeDoc(a, b, SCHEMA.sync).dl).length, 2);
});

// ---------------- API ----------------
test('kodi i pavlefshëm → 400, pa komanda Redis', async () => {
  commands = 0;
  for (const code of ['', 'abcde23456', 'ABCDE2345', 'ABCDE234567', 'ABCDE23450', 'ABCDE-2345']) {
    const r = await call(sync, { url: `/api/sync?code=${code}` });
    assert.equal(r.status, 400, code);
  }
  assert.equal(commands, 0);
});

test('/api/sync: GET bosh, POST bashkon, GET me etag → 304; numri i komandave', async () => {
  db.clear();
  commands = 0;
  let r = await call(sync, { url: `/api/sync?code=${CODE}` });
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.d, {});
  assert.equal(commands, 1);

  commands = 0;
  r = await call(sync, { method: 'POST', url: `/api/sync?code=${CODE}`, raw: true, body: { d: { wj: [100, { w: '2026-W41', j: 5 }], sp: { 5: [100, 12] } } } });
  assert.equal(r.status, 200);
  assert.equal(commands, 2);
  assert.deepEqual(r.body.d, { wj: [100, { w: '2026-W41', j: 5 }], sp: { 5: [100, 12] } });
  const e1 = r.body.etag;
  assert.ok(db.has(`juz:sync:${CODE}`));

  // pajisja e dytë dërgon gjendje më të vjetër + diçka të re
  r = await call(sync, { method: 'POST', url: `/api/sync?code=${CODE}`, body: { d: { wj: [50, { w: '2026-W41', j: 2 }], sp: { 5: [200, null], 6: [60, 1] }, done: { 5: [70, '2026-W41'] } } } });
  assert.deepEqual(r.body.d, { wj: [100, { w: '2026-W41', j: 5 }], sp: { 5: [200, null], 6: [60, 1] }, done: { 5: [70, '2026-W41'] } });
  const e2 = r.body.etag;
  assert.notEqual(e1, e2);

  commands = 0;
  r = await call(sync, { url: `/api/sync?code=${CODE}&etag=${e2}` });
  assert.equal(r.status, 304);
  assert.equal(r.body, undefined);
  assert.equal(commands, 1);

  r = await call(sync, { url: `/api/sync?code=${CODE}&etag=${e1}` });
  assert.equal(r.status, 200);
  assert.equal(r.body.etag, e2);

  // POST pa ndryshime ruan të njëjtin etag
  r = await call(sync, { method: 'POST', url: `/api/sync?code=${CODE}`, body: { d: {} } });
  assert.equal(r.body.etag, e2);
});

test('të dhënat e vjetra në Redis (v2) pastrohen në lexim dhe në shkrim', async () => {
  db.clear();
  db.set(`juz:sync:${CODE}`, JSON.stringify({ etag: 'old', d: { bm: [1, { j: 2, i: 3 }], pos: { 2: [1, 3] }, cur: [1, 2], st: [1, { bg: 'paper', flow: 'flip' }] } }));
  let r = await call(sync, { url: `/api/sync?code=${CODE}` });
  assert.deepEqual(r.body.d, { st: [1, { bg: 'paper' }] });
  r = await call(sync, { method: 'POST', url: `/api/sync?code=${CODE}`, body: { d: { bj: [5, { j: 2, s: 2, a: 200, p: 30 }] } } });
  assert.deepEqual(r.body.d, { bj: [5, { j: 2, s: 2, a: 200, p: 30 }], st: [1, { bg: 'paper' }] });
});

test('Redis i dëmtuar / mungon konfigurimi', async () => {
  db.set(`juz:sync:${CODE}`, '{not json');
  let r = await call(sync, { url: `/api/sync?code=${CODE}` });
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.d, {});
  const url = process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_URL;
  r = await call(sync, { url: `/api/sync?code=${CODE}` });
  assert.equal(r.status, 503);
  process.env.KV_REST_API_URL = url;
  r = await call(sync, { method: 'PUT', url: `/api/sync?code=${CODE}` });
  assert.equal(r.status, 405);
});

test('/api/qr kthen SVG', async () => {
  const r = await call(qr, { url: `/api/qr?code=${CODE}` });
  assert.equal(r.status, 200);
  assert.match(r.headers['content-type'], /svg/);
  assert.match(r.body, /^<svg/);
  const bad = await call(qr, { url: `/api/qr?code=nope` });
  assert.equal(bad.status, 400);
});

test('/api/font: kalon fontin e Diyanetit me cache të gjatë; dështon pastër kur Diyanet nuk përgjigjet', async () => {
  fontMode = 'ok';
  let r = await call(font, { url: '/api/font' });
  assert.equal(r.status, 200);
  assert.equal(r.headers['content-type'], 'font/ttf');
  assert.match(r.headers['cache-control'], /s-maxage=31536000/);
  fontMode = 'down';
  r = await call(font, { url: '/api/font' });
  assert.equal(r.status, 502);
  assert.equal(r.headers['cache-control'], 'no-store');
});

test('/api/qcf-text: kodet fjalë për fjalë, pjesë sipas faqes, pa shenjën e fundit; merren një herë, pastaj nga Redis', async () => {
  const before = quranCalls;
  const r = await qcfText(new Request('https://juz.test/api/qcf-text?s=112'));
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.deepEqual(j.s['112'], { 1: [[604, 'ﰀ ﰁ']], 2: [[604, 'ﰀ ﰁ']], 3: [[604, 'ﰀ ﰁ']], 4: [[604, 'ﱁ'], [605, 'ﱂﱃ']] });
  assert.equal(quranCalls - before, 2);
  const again = await (await qcfText(new Request('https://juz.test/api/qcf-text?s=112-112'))).json();
  assert.deepEqual(again.s['112'], j.s['112']);
  assert.equal(quranCalls - before, 2, 'e dyta lexohet nga Redis');
  for (const bad of ['0', '115', '5-2', '1-60', 'x']) assert.equal((await qcfText(new Request(`https://juz.test/api/qcf-text?s=${bad}`))).status, 400);
});

test('/api/qcf-font: WOFF2 me cache të gjatë; faqe e pavlefshme → 400; CDN poshtë → 502', async () => {
  fontMode = 'ok';
  const r = await qcfFont(new Request('https://juz.test/api/qcf-font?p=293'));
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('content-type'), 'font/woff2');
  assert.match(r.headers.get('cache-control'), /max-age=31536000/);
  assert.equal((await qcfFont(new Request('https://juz.test/api/qcf-font?p=605'))).status, 400);
  fontMode = 'down';
  assert.equal((await qcfFont(new Request('https://juz.test/api/qcf-font?p=1'))).status, 502);
  fontMode = 'ok';
});

test('/api/qcf-text: nuk kalon kufirin e thirrjeve; kthen "more" dhe e plotëson herën tjetër', async () => {
  const before = quranCalls;
  const r1 = await (await qcfText(new Request('https://juz.test/api/qcf-text?s=1-3'))).json();
  // 1 (7 ajete: 1 thirrje) + 2 (286: 6) + 3 (200: 4) = 11 ≤ 40 → të gjitha njëherësh
  assert.deepEqual(Object.keys(r1.s), ['1', '2', '3']);
  assert.equal(r1.more, undefined);
  assert.equal(Object.keys(r1.s['2']).length, 286);
  assert.equal(quranCalls - before, 11);
  // 40 sure të shkurtra të paruajtura: 40 thirrje lejohen, asnjë më shumë
  const b2 = quranCalls;
  const r2 = await (await qcfText(new Request('https://juz.test/api/qcf-text?s=60-99'))).json();
  assert.ok(quranCalls - b2 <= 40);
  const got = Object.keys(r2.s).length, left = (r2.more || []).length;
  assert.equal(got + left, 40);
});
