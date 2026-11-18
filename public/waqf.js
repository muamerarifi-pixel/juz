// Shenjat e ndalimit (Vakfi) dhe udhëzimet në shqip — si duhet lexuar te secila shenjë.

export const WAQF_CATS = {
  stop: { badge: 'Ndalu', icon: '●' },
  both: { badge: 'Ndalu ose vazhdo', icon: '◐' },
  cont: { badge: 'Më mirë vazhdo', icon: '→' },
  no:   { badge: 'Mos u ndal', icon: '✕' },
  sakt: { badge: 'Ndalu pa frymë', icon: '⏸' },
};

export const WAQF_DEFS = {
  m: {
    id: 'm', cat: 'stop', sym: 'مـ',
    badge: 'Ndalu patjetër',
    name: 'Vakf Lazim · Ndalim i domosdoshëm',
    desc: 'Ndalu patjetër te kjo fjalë dhe merr frymë, pastaj vazhdo me fjalën tjetër. Nëse e lidh pa u ndalur, mund të ndryshojë kuptimi i ajetit.',
  },
  t: {
    id: 't', cat: 'stop', sym: 'ط',
    badge: 'Ndalu këtu',
    name: 'Vakf Mutlak · Ndalim i plotë',
    desc: 'Kuptimi i mendimit plotësohet këtu. Ndalu, merr frymë dhe pastaj vazhdo drejt me fjalën pasuese.',
  },
  qala: {
    id: 'qala', cat: 'stop', sym: 'قلى',
    badge: 'Më mirë ndalu',
    name: 'El-Vakfu Evla · Ndalimi është më i mirë',
    desc: 'Lejohet edhe të vazhdosh, por më e mira është të ndalesh këtu, të marrësh frymë e pastaj të vazhdosh.',
  },
  ayn: {
    id: 'ayn', cat: 'stop', sym: 'ع',
    badge: 'Fund teme — ndalu',
    name: 'Ruku · Përmbyllje e temës',
    desc: 'Shënon përfundimin e një teme ose tregimi. Është vendi më i përshtatshëm për të përfunduar leximin ose për ruku në namaz.',
  },
  j: {
    id: 'j', cat: 'both', sym: 'ج',
    badge: 'Ndalu ose vazhdo',
    name: 'Vakf Xhaiz · Të dyja lejohen njësoj',
    desc: 'Mund të ndalesh për të marrë frymë ose të vazhdosh pa u ndalur — të dyja mënyrat janë plotësisht të sakta.',
  },
  mu: {
    id: 'mu', cat: 'both', sym: '∴',
    badge: 'Ndalu vetëm te njëra',
    name: 'Vakf Mu’aneka · Tre pikat dyshe',
    desc: 'Kjo shenjë vjen gjithmonë në çift (dy fjalë me ∴). Ndalu te e para dhe vazhdo te e dyta, OSE vazhdo te e para dhe ndalu te e dyta — kurrë te të dyja.',
  },
  k: {
    id: 'k', cat: 'both', sym: 'ك',
    badge: 'Si shenja e mëparshme',
    name: 'Kezalik · Njësoj si shenja para saj',
    desc: 'Kjo fjalë merr të njëjtin rregull ndalimi ose vazhdimi si shenja e fundit që kalove para saj në këtë ajet.',
  },
  z: {
    id: 'z', cat: 'cont', sym: 'ز',
    badge: 'Më mirë vazhdo',
    name: 'Vakf Muxhevvez · Vazhdo nëse ke frymë',
    desc: 'Më e mira është të vazhdosh leximin pa u ndalur. Megjithatë, nëse të mbaron fryma, lejohet të ndalesh këtu.',
  },
  s: {
    id: 's', cat: 'cont', sym: 'صلى',
    badge: 'Më mirë vazhdo',
    name: 'El-Vaslu Evla / ص · Vazhdimi është më i mirë',
    desc: 'Më mirë vazhdo pa u ndalur. Nëse je lodhur ose të mbaron fryma, lejohet të ndalesh këtu dhe të nisesh nga fjala tjetër.',
  },
  q: {
    id: 'q', cat: 'cont', sym: 'ق',
    badge: 'Më mirë vazhdo',
    name: 'Kile alejhil-vakf · Zakonisht mos u ndal',
    desc: 'Shumica e dijetarëve preferojnë të vazhdosh pa u ndalur, prandaj kaloje nëse ke frymë.',
  },
  la: {
    id: 'la', cat: 'no', sym: 'لا',
    badge: 'Mos u ndal',
    name: 'La vakfe fih · Lidhje kuptimore',
    desc: 'Mos u ndal këtu sepse fjalia nuk ka mbaruar. Nëse të mbaron fryma detyrimisht, ndalu, merr frymë dhe përsërite një ose dy fjalë më parë.',
    descEnd: 'Kjo shenjë (لا) është në fund të ajetit: lejohet të ndalesh për frymë sepse mbaron ajeti, por kuptimi lidhet drejtpërdrejt me ajetin tjetër.',
  },
  sakt: {
    id: 'sakt', cat: 'sakt', sym: 'سكتة',
    badge: 'Ndalu pa frymë',
    name: 'Sekte · Pauzë e shkurtër pa marrë frymë',
    desc: 'Ndërprite zërin për rreth 1–2 sekonda PA marrë frymë të re, pastaj vazhdo menjëherë me fjalën tjetër.',
  },
};

export const WAQF_ORDER = ['m', 't', 'qala', 'ayn', 'j', 'mu', 'k', 'z', 's', 'q', 'la', 'sakt'];

const SAKT_WORDS_H = /(?:عِوَجًۜا|مَرْقَدِنَۜا|مَنْۜ|بَلْۜ)/;

// Kthen kodin e shenjës së ndalimit brenda një fjale arabe, ose null nëse nuk ka.
export function detectWaqf(word, mode = 'd') {
  if (!word) return null;
  if (mode === 'h') {
    if (word.includes('\u06dc')) return SAKT_WORDS_H.test(word) ? 'sakt' : 't';
    if (word.includes('\u06db')) return 'mu';
    if (/\u06e2[^\p{L}]*$/u.test(word)) return 'm';
    if (word.includes('\u06d7')) return 'qala';
    if (word.includes('\u06da')) return 'j';
    if (word.includes('\u06d8')) return 'z';
    if (word.includes('\u06d6')) return 's';
    if (word.includes('\u06e0')) return 'q';
    if (word.includes('\u06d9')) return 'la';
    if (word.includes('\u06e8')) return 'k';
    if (word.includes('\u06df')) return 'ayn';
    return null;
  }
  if (word.includes('\u06dc')) return 'sakt';
  if (word.includes('\u06db')) return 'mu';
  if (word.includes('\u06d8')) return 'm';
  if (word.includes('\u0615')) return 't';
  if (word.includes('\u08d7')) return 'qala';
  if (word.includes('\u06da')) return 'j';
  if (word.includes('\u0617')) return 'z';
  if (word.includes('\u08d5')) return 's';
  if (word.includes('\u08de')) return 'q';
  if (word.includes('\u06d9')) return 'la';
  if (word.includes('\u08d9')) return 'k';
  if (word.includes('\u08d6')) return 'ayn';
  return null;
}

const escHTML = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Ndërton HTML-në e fjalëve arabe duke vënë fjalët me shenjë ndalimi brenda <span class="wq"> të klikueshëm.
export function renderArWords(text, mode = 'd') {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  return words.map((w, idx) => {
    const id = detectWaqf(w, mode);
    if (!id) return escHTML(w);
    const def = WAQF_DEFS[id];
    const isEnd = idx === words.length - 1;
    return `<span class="wq" data-wq="${id}" data-cat="${def.cat}"${isEnd ? ' data-end="1"' : ''} tabindex="0" role="button" aria-label="${escHTML(def.badge + ' — ' + def.name)}">${escHTML(w)}</span>`;
  }).join(' ');
}
