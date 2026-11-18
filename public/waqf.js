// Shenjat e ndalimit (Vakfi), shqiptimet e veçanta dhe 14 ajetet e Sexhdes — udhëzime praktike në shqip.

export const WAQF_CATS = {
  stop:  { badge: 'Ndalu', icon: '●' },
  both:  { badge: 'Ndalu ose vazhdo', icon: '◐' },
  cont:  { badge: 'Më mirë vazhdo', icon: '→' },
  no:    { badge: 'Mos u ndal', icon: '✕' },
  sakt:  { badge: 'Ndalu pa frymë', icon: '⏸' },
  pron:  { badge: 'Shqiptim i veçantë', icon: '✦' },
  sajda: { badge: 'Sexhde Tilaveti', icon: '۩' },
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
  imale: {
    id: 'imale', cat: 'pron', sym: 'إمالة',
    badge: 'Lexohet: "mexhrêhâ"',
    name: 'Imale · Animi i zanores A kah E (Hud 11:41)',
    desc: 'Shqiptohet: «Bismil-lâhi mexhrêhâ ve mursâhâ». Zanorja pas shkronjës R në مَجْرٰ۪یهَا lexohet mes A-së dhe E-së (si një "e" e hapur e zgjatur: mexhrêhâ). Ky është rasti i vetëm i Imales në Kur’an.',
  },
  ishmam: {
    id: 'ishmam', cat: 'pron', sym: 'إشمام',
    badge: 'Lexohet: "lâ te’mennâ"',
    name: 'Ishmam · Mbledhja e buzëve te N-ja (Jusuf 12:11)',
    desc: 'Shqiptohet: «Mâ leke lâ te’mennâ». Gjatë mbajtjes së N-së së dyfishtë (نَّ), mblidhi buzët përpara si kur thua "U", pa nxjerrë zë "u", dhe vazhdo me "nâ".',
  },
  teshil: {
    id: 'teshil', cat: 'pron', sym: 'تسهيل',
    badge: 'Lexohet: "e-a’xhemijjun"',
    name: 'Teshil · Lehtësimi i hemzes së dytë (Fussilet 41:44)',
    desc: 'Shqiptohet: «E-a’xhemijjun ve arabijj». Hemzeja e parë lexohet qartë "E", ndërsa e dyta (me rreth ۬) lexohet e butë mes hemzes dhe elifit, pa e prerë zërin fort në fyt.',
  },
  idgam_bm: {
    id: 'idgam_bm', cat: 'pron', sym: 'إدغام',
    badge: 'Lexohet: "irkem-me’anâ"',
    name: 'Idgam · Shkrirja e B-së në M (Hud 11:42)',
    desc: 'Shqiptohet: «Jâ bunejje irkem-me’anâ» (jo "irkeb me’anâ"). Shkronja B (بْ) në fund të ارْكَبْۭ shkrihet plotësisht te shkronja M (مَ) e fjalës مَعَنَا me hundëzim (gunneh).',
  },
  sin_sad: {
    id: 'sin_sad', cat: 'pron', sym: 'س',
    badge: 'Lexohet me S të hollë',
    name: 'Sin mbi Sad · Lexohet me "S" (2:245, 7:69)',
    desc: 'Edhe pse është shkruar me shkronjën Sad (ص), shkronja e vogël Sin (س) sipër saj tregon se në transmetimin e Hafsit lexohet me "S" të hollë: «jebsut» (2:245) dhe «bestaten» (7:69).',
  },
  alif_sifr: {
    id: 'alif_sifr', cat: 'pron', sym: 'اْ',
    badge: 'Mos e zgjat kur vazhdon',
    name: 'Elifi me rreth (ا࣑ / ا۬) · Lexohet shkurt në vazhdim',
    desc: 'Shqiptohet shkurt kur vazhdon leximin pa u ndalur (p.sh. اَنَا࣑ lexohet «ene» e jo «enâ»; لٰكِنَّا࣑ lexohet «lâkinne»; الظُّنُونَا، الرَّسُولَا، السَّبٖیلَا، قَوَارٖیرَا pa zgjatje në fund). Vetëm nëse ndalesh te kjo fjalë, atëherë e zgjat fundin («enâ»…).',
  },
};

export const WAQF_ORDER = ['m', 't', 'qala', 'ayn', 'j', 'mu', 'k', 'z', 's', 'q', 'la', 'sakt'];
export const PRON_ORDER = ['imale', 'ishmam', 'teshil', 'idgam_bm', 'sin_sad', 'alif_sifr'];

export const SAJDA_LIST = [
  ['7:206', "El-A'raf 7:206"],
  ['13:15', "Er-Ra'd 13:15"],
  ['16:50', 'En-Nahl 16:50'],
  ['17:109', 'El-Isra 17:109'],
  ['19:58', 'Merjem 19:58'],
  ['22:18', 'El-Haxh 22:18'],
  ['25:60', 'El-Furkan 25:60'],
  ['27:26', 'En-Neml 27:26'],
  ['32:15', 'Es-Sexhde 32:15'],
  ['38:24', 'Sad 38:24'],
  ['41:38', 'Fussilet 41:38'],
  ['53:62', 'En-Nexhm 53:62'],
  ['84:21', 'El-Inshikak 84:21'],
  ['96:19', 'El-Alek 96:19'],
];
export const SAJDA_VERSES = new Set(SAJDA_LIST.map(([k]) => k));
export const SAJDA_INFO = {
  cat: 'sajda',
  sym: '۩',
  badge: 'Sexhde Tilaveti',
  name: 'Ajet Sexhdeje · Sexhdeja e leximit',
  desc: 'Kur lexon ose dëgjon këtë ajet, është detyrë (vaxhib / sunet i fortë) të bësh një sexhde: thuaj «Allahu Ekber» (pa i ngritur duart), bjer në sexhde një herë, lexo duanë më poshtë dhe ngrihu me «Allahu Ekber» (pa dhënë selam).',
  duaAr: 'سَجَدَ وَجْهِيَ لِلَّذِي خَلَقَهُ وَشَقَّ سَمْعَهُ وَبَصَرَهُ بِحَوْلِهِ وَقُوَّتِهِ',
  duaTr: '«Sexhede vexh’hije lil-ledhî halekahu ve shekka sem’ahu ve besarahu bi havlihî ve kuvvetihî» (ose 3 herë: «Subhâne Rabbijel-A’lâ»)',
  duaSq: '«Fytyra ime i ra në sexhde Atij që e krijoi dhe i hapi dëgjimin e shikimin me fuqinë dhe forcën e Tij.»',
};

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

// Kthen kodin e shqiptimit të veçantë brenda një fjale arabe, ose null.
export function detectPron(word) {
  if (!word) return null;
  if (word.includes('\u06ea') && /مَجْر/.test(word)) return 'imale';
  if (word.includes('\u06eb') && /تَاْمَن/.test(word)) return 'ishmam';
  if (word.includes('\u06ec') && /عْجَم/.test(word)) return 'teshil';
  if (word.includes('\u06ed')) return 'idgam_bm';
  if (word.includes('\u06e3')) return 'sin_sad';
  if (
    /ا(?:\u08d1|\u06ec)[^\p{L}]*$/u.test(word) ||
    /^(?:وَ|فَ)?اَنَا[^\p{L}]*$/u.test(word) ||
    /^(?:الظُّنُونَا|الرَّسُولَا|السَّب[ٖ۪][یي]لَا|قَوَار[ٖ۪][یي]رَا)/.test(word)
  ) return 'alif_sifr';
  return null;
}

const escHTML = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Ndërton HTML-në e fjalëve arabe duke vënë fjalët me shenjë ndalimi ose shqiptim të veçantë brenda <span class="wq">.
export function renderArWords(text, mode = 'd') {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  return words.map((w, idx) => {
    const pronId = detectPron(w);
    const waqfId = detectWaqf(w, mode);
    const primary = pronId || waqfId;
    if (!primary) return escHTML(w);
    const secondary = pronId && waqfId ? waqfId : null;
    const def = WAQF_DEFS[primary];
    const isEnd = idx === words.length - 1;
    const label = secondary ? `${def.badge} · ${WAQF_DEFS[secondary].badge}` : `${def.badge} — ${def.name}`;
    return `<span class="wq" data-wq="${primary}"${secondary ? ` data-wq2="${secondary}"` : ''} data-cat="${def.cat}"${isEnd ? ' data-end="1"' : ''} tabindex="0" role="button" aria-label="${escHTML(label)}">${escHTML(w)}</span>`;
  }).join(' ');
}
