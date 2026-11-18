import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { WAQF_DEFS, WAQF_ORDER, detectWaqf, renderArWords } from '../public/waqf.js';

test('waqf: detects every stop/continue mark accurately in d and h modes', () => {
  assert.equal(detectWaqf('الدّٖینِؕ', 'd'), 't');
  assert.equal(detectWaqf('الدّ۪ينِۜ', 'h'), 't');
  assert.equal(detectWaqf('عِوَجًۜاؕ', 'd'), 'sakt');
  assert.equal(detectWaqf('عِوَجًۜاۜ', 'h'), 'sakt');
  assert.equal(detectWaqf('بَلْۜ', 'h'), 'sakt');
  assert.equal(detectWaqf('رَیْبَۚۛ', 'd'), 'mu');
  assert.equal(detectWaqf('بِمُؤْمِنٖینَۘ', 'd'), 'm');
  assert.equal(detectWaqf('بِمُؤْمِن۪ينَۢ', 'h'), 'm');
  assert.equal(detectWaqf('الْعَالَمٖینَۙ', 'd'), 'la');
  assert.equal(detectWaqf('الٓمٓۚ', 'd'), 'j');
  assert.equal(detectWaqf('غِشَاوَةٌؗ', 'd'), 'z');
  assert.equal(detectWaqf('غِشَاوَةٌۘ', 'h'), 'z');
  assert.equal(detectWaqf('بِالْهُدٰىࣕ', 'd'), 's');
  assert.equal(detectWaqf('بِالْهُدٰىۖ', 'h'), 's');
  assert.equal(detectWaqf('عَظٖیمٌࣖ', 'd'), 'ayn');
  assert.equal(detectWaqf('عَظ۪يمٌ۟', 'h'), 'ayn');
  assert.equal(detectWaqf('الْكِتَابَࣗ', 'd'), 'qala');
  assert.equal(detectWaqf('الْكِتَابَۗ', 'h'), 'qala');
  assert.equal(detectWaqf('یَوْمَئِذٍࣙ', 'd'), 'k');
  assert.equal(detectWaqf('يَوْمَئِذٍۨ', 'h'), 'k');
  assert.equal(detectWaqf('خَلَاقٍࣞ', 'd'), 'q');
  assert.equal(detectWaqf('خَلَاقٍ۠', 'h'), 'q');
  // Non-waqf tajwid marks must not match as stop signs
  assert.equal(detectWaqf('بِسْمِ', 'd'), null);
  assert.equal(detectWaqf('اُو࣑لٰٓئِكَ', 'd'), null);
  assert.equal(detectWaqf('الرَّح۪يمِ', 'h'), null);
});

test('waqf: renderArWords wraps marked words cleanly and marks end-of-ayah', () => {
  const html = renderArWords('مَالِكِ یَوْمِ الدّٖینِۙ', 'd');
  assert.match(html, /^مَالِكِ یَوْمِ <span class="wq" data-wq="la" data-cat="no" data-end="1"/);
  assert.ok(!html.includes('<script'));

  const mid = renderArWords('الٓمٓۚ ذٰلِكَ الْكِتَابُ', 'd');
  assert.match(mid, /data-wq="j" data-cat="both" tabindex="0"/);
  assert.ok(!mid.includes('data-end="1"'));
});

test('waqf: catalog covers all WAQF_ORDER definitions with Albanian explanations', () => {
  for (const id of WAQF_ORDER) {
    const def = WAQF_DEFS[id];
    assert.ok(def, `Missing WAQF_DEFS[${id}]`);
    assert.ok(def.sym && def.badge && def.name && def.desc);
  }
});

test('waqf: every waqf character across all 30 juz JSON files maps cleanly', () => {
  for (let i = 1; i <= 30; i++) {
    const j = JSON.parse(fs.readFileSync(`public/data/juz-${String(i).padStart(2, '0')}.json`, 'utf8'));
    for (const a of j.a) {
      for (const w of a.d.split(/\s+/)) {
        if (/[\u0615\u0617\u06d8-\u06dc\u08d5-\u08d7\u08d9\u08de]/.test(w)) {
          assert.ok(detectWaqf(w, 'd'), `Unmapped d waqf in ${a.s}:${a.a} word ${w}`);
        }
      }
      for (const w of a.h.split(/\s+/)) {
        if (/[\u06d6-\u06df\u06e0\u06e2\u06e8]/.test(w)) {
          assert.ok(detectWaqf(w, 'h'), `Unmapped h waqf in ${a.s}:${a.a} word ${w}`);
        }
      }
    }
  }
});
