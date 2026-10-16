#!/usr/bin/env node
// Ndërton skedarët statikë në data/ nga burimet në GitHub.
//
//   node scripts/build-data.mjs                   # shkarkon gjithçka nga GitHub
//   node scripts/build-data.mjs --kuran ../Kuran  # përdor një klon lokal të alperenugus/Kuran
//
// Burimet:
//  - Mus'hafi i Diyanetit: github.com/alperenugus/Kuran (CC BY 4.0) — tekst, faqe, xhuze, emra sureve
//  - Përkthimi shqip: Hassan Nahi, QuranEnc.com (albanian_nahi v1.1.0), botuar nga AIITC.
//    Merret nga kopja e pandryshuar në github.com/risan/quran-json; rezervë: API-ja e QuranEnc.com.
//
// Dalja:
//  data/juz-01.json … juz-30.json  { juz, a: [{ s, a, d, h, t, p, sj? }] }
//     s = sureja, a = ajeti, d = arabisht (Unicode standard, për Scheherazade/Naskh),
//     h = arabisht (kodimi i fontit Shaikh Hamdullah të Diyanetit), t = shqip (QuranEnc), p = faqja (1–605)
//  data/meta.json   sure, xhuze (sipas Mus'hafit të Diyanetit: çdo xhuz fillon në krye të faqes)
//  data/pages.json  { "<faqe>": { n: numri i shtypur, r: [[sure, ajetiPrej, ajetiDeri], …] } }

import { mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'data');

const KURAN_RAW = 'https://raw.githubusercontent.com/alperenugus/Kuran/main';
const NAHI_RAW = 'https://raw.githubusercontent.com/risan/quran-json/main/data/quranenc/albanian_nahi.json';
const QURANENC_API = 'https://quranenc.com/api/v1/translation/sura/albanian_nahi';
const NAHI_VERSION = '1.1.0';

const args = process.argv.slice(2);
const kuranDir = args.includes('--kuran') ? args[args.indexOf('--kuran') + 1] : null;

// Emrat shqip të sureve (transliterim i zakonshëm në shqip).
const SQ_NAMES = [
  'Fatiha', 'Bekare', 'Ali Imran', 'Nisa', 'Maide', "En'am", "A'raf", 'Enfal', 'Teube', 'Junus',
  'Hud', 'Jusuf', "Ra'd", 'Ibrahim', 'Hixhr', 'Nahl', 'Isra', 'Kehf', 'Merjem', 'Taha',
  'Enbija', 'Haxh', "Mu'minun", 'Nur', 'Furkan', "Shu'ara", 'Neml', 'Kasas', 'Ankebut', 'Rum',
  'Llukman', 'Sexhde', 'Ahzab', "Sebe'", 'Fatir', 'Jasin', 'Saffat', 'Sad', 'Zumer', 'Gafir',
  'Fussilet', 'Shura', 'Zuhruf', 'Duhan', 'Xhathije', 'Ahkaf', 'Muhammed', 'Fet-h', 'Huxhurat', 'Kaf',
  'Dharijat', 'Tur', 'Nexhm', 'Kamer', 'Rrahman', "Vaki'a", 'Hadid', 'Muxhadele', 'Hashr', 'Mumtehine',
  'Saff', "Xhumu'a", 'Munafikun', 'Tegabun', 'Talak', 'Tahrim', 'Mulk', 'Kalem', 'Hakka', 'Mearixh',
  'Nuh', 'Xhinn', 'Muzzemmil', 'Muddeththir', 'Kijame', 'Insan', 'Murselat', "Nebe'", "Nazi'at", 'Abese',
  'Tekvir', 'Infitar', 'Mutaffifin', 'Inshikak', 'Buruxh', 'Tarik', "A'la", 'Gashije', 'Fexhr', 'Beled',
  'Shems', 'Lejl', 'Duha', 'Inshirah', 'Tin', 'Alak', 'Kadr', 'Bejjine', 'Zelzele', 'Adijat',
  "Kari'a", 'Tekathur', 'Asr', 'Humeze', 'Fil', 'Kurejsh', "Ma'un", 'Kevther', 'Kafirun', 'Nasr',
  'Mesed', 'Ihlas', 'Felek', 'Nas',
];

// Kuptimi i emrit të sures në shqip.
const SQ_MEAN = ["Hapja", "Lopa", "Familja e Imranit", "Gratë", "Sofra", "Bagëtia", "Lartësitë", "Plaçka e luftës", "Pendimi", "Junusi", "Hudi", "Jusufi", "Bubullima", "Ibrahimi", "Hixhri", "Bletët", "Udhëtimi i natës", "Shpella", "Merjemja", "Taha", "Pejgamberët", "Haxhi", "Besimtarët", "Drita", "Dallimi", "Poetët", "Milingonat", "Tregimet", "Merimanga", "Bizantinët", "Llukmani", "Sexhdeja", "Aleatët", "Sebeja", "Krijuesi", "Jasin", "Të rreshtuarit", "Sad", "Grupet", "Falësi", "Të shtjelluarat", "Këshillimi", "Stolitë", "Tymi", "Të gjunjëzuarit", "Kodrat e rërës", "Muhamedi", "Fitorja", "Dhomat", "Kaf", "Erërat", "Mali Tur", "Ylli", "Hëna", "I Gjithëmëshirshmi", "Ngjarja", "Hekuri", "Grindja", "Dëbimi", "E sprovuara", "Rreshti", "E xhumaja", "Hipokritët", "Humbja e ndërsjellë", "Shkurorëzimi", "Ndalimi", "Pushteti", "Pena", "E vërteta e pashmangshme", "Shkallët", "Nuhu", "Xhindet", "I mbështjelli", "I mbuluari", "Kiameti", "Njeriu", "Të dërguarat", "Lajmi", "Ata që shkulin", "U vrenjt", "Mbështjellja", "Çarja", "Mashtruesit në peshë", "Shqyerja", "Yjësitë", "Ylli i natës", "Më i Larti", "Mbuluesja", "Agimi", "Qyteti", "Dielli", "Nata", "Paradita", "Zgjerimi", "Fiku", "Gjaku i ngjizur", "Nata e Kadrit", "Prova e qartë", "Tërmeti", "Kuajt vrapues", "Fatkeqësia", "Grumbullimi", "Koha", "Përgojuesi", "Elefanti", "Kurejshët", "Ndihma", "Bollëku", "Mohuesit", "Fitorja e Allahut", "Litari", "Sinqeriteti", "Lindja e dritës", "Njerëzit"];

async function getJSON(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`${r.status} ${url}`);
      return await r.json();
    } catch (e) {
      if (i === 2) throw e;
      await new Promise((ok) => setTimeout(ok, 1500 * (i + 1)));
    }
  }
}

async function loadNahi() {
  try {
    const d = await getJSON(NAHI_RAW);
    return Object.values(d).flat().map((v) => ({ s: v.chapter, a: v.verse, t: v.text }));
  } catch (e) {
    console.warn(`Kopja në GitHub nuk u shkarkua (${e.message}); po provoj QuranEnc.com…`);
    const out = [];
    for (let n = 1; n <= 114; n++) {
      const d = await getJSON(`${QURANENC_API}/${n}`);
      for (const v of d.result) out.push({ s: +v.sura, a: +v.aya, t: v.translation });
    }
    return out;
  }
}

async function loadKuran() {
  if (kuranDir) return JSON.parse(await readFile(join(kuranDir, 'kuran.json'), 'utf8'));
  return getJSON(`${KURAN_RAW}/kuran.json`);
}

const clean = (s) => s.replace(/\u0640/g, '').replace(/\s+/g, ' ').trim();

async function main() {
  if (SQ_NAMES.length !== 114) throw new Error('SQ_NAMES duhet të ketë 114 emra');
  console.log('Duke shkarkuar burimet…');
  const [kuran, nahi] = await Promise.all([loadKuran(), loadNahi()]);
  const nahiMap = new Map(nahi.map((v) => [`${v.s}:${v.a}`, clean(v.t)]));

  const all = [];
  for (const su of kuran.surahs) {
    for (const ay of su.ayahs) {
      const t = nahiMap.get(`${su.number}:${ay.ayah}`);
      if (!t) throw new Error(`Mungon përkthimi për ${su.number}:${ay.ayah}`);
      all.push({ s: su.number, a: ay.ayah, d: clean(ay.text_unicode), h: clean(ay.text), t, p: ay.page, pn: ay.printed_page, juz: ay.juz, sj: !!ay.sajda });
    }
  }
  if (all.length !== 6236) throw new Error(`Numri i ajeteve ${all.length} ≠ 6236`);

  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  const juz = [];
  for (let j = 1; j <= 30; j++) {
    const list = all.filter((x) => x.juz === j);
    const a = list.map(({ s, a, d, h, t, p, sj }) => (sj ? { s, a, d, h, t, p, sj: 1 } : { s, a, d, h, t, p }));
    const f = list[0], l = list[list.length - 1];
    juz.push({ n: j, s: [f.s, f.a], e: [l.s, l.a], c: list.length, pg: [f.p, l.p] });
    await writeFile(join(OUT, `juz-${String(j).padStart(2, '0')}.json`), JSON.stringify({ juz: j, a }));
  }

  const surahs = kuran.surahs.map((su, i) => {
    const first = all.find((x) => x.s === su.number);
    const last = all.findLast((x) => x.s === su.number);
    return {
      n: su.number, sq: SQ_NAMES[i], mn: SQ_MEAN[i], ar: su.name_arabic_unicode, arh: su.name_arabic, tr: su.name_transliteration,
      c: su.ayah_count, r: su.revelation_place === 'medinan' ? 'M' : 'K', b: su.besmele || su.number === 1 ? 1 : 0,
      j: first.juz, pg: [first.p, last.p],
    };
  });

  const pages = {};
  for (const x of all) {
    const e = (pages[x.p] ||= { n: x.pn, r: [] });
    const lr = e.r[e.r.length - 1];
    if (lr && lr[0] === x.s && lr[2] === x.a - 1) lr[2] = x.a;
    else e.r.push([x.s, x.a, x.a]);
  }

  await writeFile(join(OUT, 'meta.json'), JSON.stringify({
    v: 5, built: new Date().toISOString().slice(0, 10), surahs, juz,
    tr: { key: 'albanian_nahi', version: NAHI_VERSION },
  }));
  await writeFile(join(OUT, 'pages.json'), JSON.stringify(pages));
  console.log(`Gati: 30 xhuze, ${all.length} ajete, ${Object.keys(pages).length} faqe.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
