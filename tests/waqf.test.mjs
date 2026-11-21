import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  WAQF_DEFS, WAQF_ORDER, PRON_ORDER, SAJDA_LIST, SAJDA_VERSES, SAJDA_INFO, TAJWEED_RULES,
  detectWaqf, detectPron, renderArWords,
} from '../public/waqf.js';

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
  assert.equal(detectWaqf('بِسْمِ', 'd'), null);
});

test('waqf: detects special Hafs pronunciation cases (Imale, Ishmam, Teshil, Idgam, Sin/Sad, silent Alif)', () => {
  assert.equal(detectPron('مَجْرٰ۪یهَا'), 'imale');
  assert.equal(detectPron('تَاْمَنَّ۫ا'), 'ishmam');
  assert.equal(detectPron('ءَاَ۬عْجَمِیٌّ'), 'teshil');
  assert.equal(detectPron('ارْكَبْۭ'), 'idgam_bm');
  assert.equal(detectPron('وَيَبْصُۣطُۖ'), 'sin_sad');
  assert.equal(detectPron('بَصْۣطَةًۚ'), 'sin_sad');
  assert.equal(detectPron('اَنَا࣑'), 'alif_sifr');
  assert.equal(detectPron('اَنَا۬'), 'alif_sifr');
  assert.equal(detectPron('سَلَاسِلَا࣑'), 'alif_sifr');
  assert.equal(detectPron('الرَّسُولَا'), 'alif_sifr');
  assert.equal(detectPron('اَنَابَ'), null);
});

test('waqf: renderArWords preserves dual pronunciation + stop rule via data-wq2', () => {
  const dual = renderArWords('وَیَبْصُۣطُࣕ وَاِلَیْهِ', 'd');
  assert.match(dual, /data-wq="sin_sad" data-wq2="s" data-cat="pron"/);

  const html = renderArWords('مَالِكِ یَوْمِ الدّٖینِۙ', 'd');
  assert.match(html, /^مَالِكِ یَوْمِ <span class="wq" data-wq="la" data-cat="no" data-end="1"/);
});

test('waqf: catalog covers all WAQF_ORDER, PRON_ORDER, and all 14 SAJDA_VERSES exist in data', () => {
  for (const id of [...WAQF_ORDER, ...PRON_ORDER]) {
    const def = WAQF_DEFS[id];
    assert.ok(def && def.sym && def.badge && def.name && def.desc, `Invalid WAQF_DEFS[${id}]`);
  }
  assert.equal(SAJDA_LIST.length, 14);
  assert.ok(SAJDA_INFO.duaAr && SAJDA_INFO.duaTr && SAJDA_INFO.duaSq);

  const found = new Set();
  for (let i = 1; i <= 30; i++) {
    const j = JSON.parse(fs.readFileSync(`public/data/juz-${String(i).padStart(2, '0')}.json`, 'utf8'));
    for (const a of j.a) {
      const k = `${a.s}:${a.a}`;
      if (SAJDA_VERSES.has(k)) found.add(k);
    }
  }
  assert.equal(found.size, 14);
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

test('tajweed: colors all 10 Tajweed rules accurately', () => {
  assert.equal(TAJWEED_RULES.length, 10);
  for (const r of TAJWEED_RULES) {
    assert.ok(r.how && r.how.length > 20, `Missing how-to-read guide for ${r.id}`);
  }

  // 1. Medd Lazim (6)
  assert.match(renderArWords('وَلَا الضَّٓالّٖینَ', 'd', true), /<span class="tj-madd-6">/);
  // 2. Medd Muttasil / Munfasil (4-5)
  assert.match(renderArWords('بِمَٓا اُنْزِلَ', 'd', true), /<span class="tj-madd">/);
  // 3. Medd 2 (Dagger Alif / Medd Silah)
  assert.match(renderArWords('ذٰلِكَ الْكِتَابُ', 'd', true), /<span class="tj-madd-2">ذٰ<\/span>/);
  // 4. Ghunnah (nun/mim mushaddadah)
  assert.match(renderArWords('اِنَّ الَّذٖینَ ثُمَّ', 'd', true), /<span class="tj-ghunnah">نَّ<\/span>/);
  assert.match(renderArWords('ثُمَّ', 'd', true), /<span class="tj-ghunnah">مَّ<\/span>/);
  // 5. Idgham bi-ghunnah, Shafawi, Mutajanisayn (excluding Izhar Mutlaq within single word)
  assert.match(renderArWords('مَنْ یُفْسِدُ', 'd', true), /<span class="tj-idgham">نْ<\/span>/);
  assert.doesNotMatch(renderArWords('الدُّنْیَا', 'd', true), /tj-idgham/);
  assert.match(renderArWords('قُلُوبِهِمْ مَرَضٌ', 'd', true), /<span class="tj-idgham">مْ<\/span>/);
  assert.match(renderArWords('قَدْ تَبَیَّنَ', 'd', true), /<span class="tj-idgham">دْ<\/span>/);
  // 6. Iqlab (nun sakin + ba)
  assert.match(renderArWords('مِنْ بَعْدِ', 'd', true), /<span class="tj-iqlab">نْ<\/span>/);
  // 7. Ikhfa Haqiqi & Shafawi
  assert.match(renderArWords('مِنْ قَبْلِكَ', 'd', true), /<span class="tj-ikhfa">نْ<\/span>/);
  assert.match(renderArWords('هُمْ بِمُؤْمِنٖینَ', 'd', true), /<span class="tj-ikhfa">مْ<\/span>/);
  // 8. Qalqalah (sukun + end of ayah)
  assert.match(renderArWords('خَلَقْنَا', 'd', true), /<span class="tj-qalqalah">قْ<\/span>/);
  assert.match(renderArWords('كُفُوًا اَحَدٌ', 'd', true), /<span class="tj-qalqalah">دٌ<\/span>/);
  // 9. Tafkhim (heavy Raa & heavy Allah after fatha/damma, NOT after kasra)
  assert.match(renderArWords('الرَّحْمٰنِ', 'd', true), /<span class="tj-tafkhim">رَّ<\/span>/);
  assert.match(renderArWords('قُلْ هُوَ اللّٰهُ', 'd', true), /<span class="tj-tafkhim">لّٰ<\/span>/);
  assert.doesNotMatch(renderArWords('بِسْمِ اللّٰهِ', 'd', true), /tj-tafkhim/);
  // 10. Silent (Idgham bila-ghunnah, Lam Shamsiyyah, trailing silent Alif after waw)
  assert.match(renderArWords('مِنْ رَبِّهِمْ', 'd', true), /<span class="tj-silent">نْ<\/span>/);
  assert.match(renderArWords('هُدًى لِلْمُتَّقٖینَ', 'd', true), /<span class="tj-silent">دً<\/span>/);
  assert.match(renderArWords('الرَّحْمٰنِ', 'd', true), /<span class="tj-silent">ل<\/span>/);
  assert.match(renderArWords('قَالُوا', 'd', true), /<span class="tj-silent">ا<\/span>/);
  // Off by flag produces no tj-* spans
  assert.doesNotMatch(renderArWords('اِنَّ مِنْ رَبِّهِمْ', 'd', false), /tj-/);
  // Waqf word preserves its waqf class when tajweed is active
  const mixed = renderArWords('اِنَّ اللّٰهَ قَدٖیرٌؕ', 'd', true);
  assert.match(mixed, /<span class="tj-ghunnah">نَّ<\/span>/);
  assert.match(mixed, /<span class="wq" data-wq="t" data-cat="stop"/);
});
