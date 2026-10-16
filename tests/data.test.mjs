// Kontrollon që çdo skedar xhuzi ngarkohet dhe përputhet me meta.json dhe pages.json.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const load = async (f) => JSON.parse(await readFile(new URL(`../public/data/${f}`, import.meta.url), 'utf8'));

test('30 xhuze, 6236 ajete, renditje e vazhdueshme, fusha të plota', async () => {
  const meta = await load('meta.json');
  const pages = await load('pages.json');
  assert.equal(meta.surahs.length, 114);
  assert.equal(meta.juz.length, 30);
  let total = 0, prev = null;
  for (let j = 1; j <= 30; j++) {
    const d = await load(`juz-${String(j).padStart(2, '0')}.json`);
    assert.equal(d.juz, j);
    const jm = meta.juz[j - 1];
    assert.equal(d.a.length, jm.c);
    assert.deepEqual([d.a[0].s, d.a[0].a], jm.s);
    assert.deepEqual([d.a.at(-1).s, d.a.at(-1).a], jm.e);
    for (const x of d.a) {
      for (const k of ['d', 't']) assert.ok(typeof x[k] === 'string' && x[k].length > 0, `${j} ${x.s}:${x.a} ${k}`);
      assert.ok(!('m' in x) && !('f' in x), 'fusha të hequra');
      assert.ok(!/\bPerëndi(a|së|në|)\b/.test(x.t), `"Perëndi" në përkthim ${x.s}:${x.a}`);
      assert.ok(x.p >= jm.pg[0] && x.p <= jm.pg[1], `faqja jashtë xhuzit ${x.s}:${x.a}`);
      assert.ok(pages[x.p].r.some(([s, a1, a2]) => s === x.s && x.a >= a1 && x.a <= a2));
      if (prev) {
        const next = prev.a < meta.surahs[prev.s - 1].c ? [prev.s, prev.a + 1] : [prev.s + 1, 1];
        assert.deepEqual([x.s, x.a], next);
      }
      prev = x;
      total++;
    }
  }
  assert.equal(total, 6236);
  // xhuzet ndjekin njëri-tjetrin pa boshllëqe faqesh
  for (let j = 1; j < 30; j++) assert.equal(meta.juz[j].pg[0], meta.juz[j - 1].pg[1] + 1);
  assert.equal(meta.tr.key, 'albanian_nahi');
  for (const su of meta.surahs) assert.ok(su.j >= 1 && su.j <= 30 && su.pg[0] <= su.pg[1]);
  assert.equal(meta.surahs.reduce((n, s) => n + s.c, 0), 6236);
  assert.equal(Object.keys(pages).length, 605);
});
