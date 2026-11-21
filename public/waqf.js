// Shenjat e ndalimit (Vakfi), shqiptimet e veçanta, 14 ajetet e Sexhdes dhe të gjitha rregullat e Texhvidit offline.

export const WAQF_CATS = {
  stop:  { badge: 'Ndalu', icon: '●' },
  both:  { badge: 'Ndalu ose vazhdo', icon: '◐' },
  cont:  { badge: 'Më mirë vazhdo', icon: '→' },
  no:    { badge: 'Mos u ndal', icon: '✕' },
  sakt:  { badge: 'Ndalu pa frymë', icon: '⏸' },
  pron:  { badge: 'Shqiptim i veçantë', icon: '✦' },
  sajda: { badge: 'Sexhde Tilaveti', icon: '۩' },
};

export const TAJWEED_RULES = [
  {
    id: 'madd-6', sym: 'آلّ', badge: 'Medd Lazim · 6 lëvizje',
    name: 'Zgjatje e domosdoshme (6 harakat)',
    desc: 'Kur shenja e zgjatjes (~) pasohet nga shede (ّ), sukun (ْ) në të njëjtën fjalë, ose te shkronjat e ndara në fillim të sureve (الٓمٓ، قٓ، صٓ).',
    how: 'Zgjate zanoren plotësisht 6 numërime (rreth 3 sekonda) para se ta shtypësh shkronjën me shede. Shembull: الضَّٓالّٖینَ → «ed-dââââââllîn»; الٓمٓ → «elif-lââââââm-mîîîîîîm».',
  },
  {
    id: 'madd', sym: 'آء', badge: 'Medd · 4–5 lëvizje',
    name: 'Medd Muttasil & Munfasil (4–5 harakat)',
    desc: 'Kur shenja e zgjatjes (~) pasohet nga hemzeja (ء / ا) në të njëjtën fjalë (Muttasil) ose në fjalën pasuese (Munfasil), si dhe te Medd Silah Kubra (عِلْمِهٖٓ).',
    how: 'Zgjate zanoren qetë 4 deri në 5 numërime (rreth 2 sekonda) pa u ndalur. Shembull: السَّمَٓاءِ → «es-semââââ-i»; بِمَٓا اُنْزِلَ → «bimââââ unzile».',
  },
  {
    id: 'madd-2', sym: 'ـٰ', badge: 'Medd · 2 lëvizje',
    name: 'Elifi i vogël (ٰ) & Medd Silah (2 harakat)',
    desc: 'Elifi i vogël vertikal mbi shkronjë (ٰ) dhe përemri هٖ / ه۪ kur lidhet me fjalën tjetër.',
    how: 'Zgjate zanoren natyrshëm 2 numërime (si dy zanore të shkurtra). Shembull: الرَّحْمٰنِ → «er-rahmân» (jo «rahman»); بِهٖ → «bihî».',
  },
  {
    id: 'ghunnah', sym: 'نّ مّ', badge: 'Gunneh · 2 lëvizje',
    name: 'Nun (نّ) dhe Mim (مّ) me shede',
    desc: 'Çdo herë që shkronja ن ose م ka shede (ّ) sipër saj.',
    how: 'Mbaje zërin butë në hundë (hundëzim) për 2 numërime para se të kalosh te zanorja. Shembull: اِنَّ → «innn-ne»; ثُمَّ → «thummm-me».',
  },
  {
    id: 'idgham', sym: 'ي ن م و', badge: 'Idgam · 2 lëvizje',
    name: 'Shkrirje me hundëzim (Idgam)',
    desc: 'Nuni me sukun/tenvini para (ي ن م و), mimi me sukun para (م), si dhe shkronjat e njëjta ose të afërta që shkrihen bashkë (p.sh. دْ + ت).',
    how: 'Mos e shqipto shkronjën e parë veçmas — shkrije drejt në shkronjën tjetër me hundëzim 2 numërime (për ي ن م و / مْ+م). Shembull: مَنْ یَّعْمَلْ → «mej-ja’mel»; قَدْ تَبَیَّنَ → «kat-tebejjene».',
  },
  {
    id: 'iqlab', sym: 'نْ ب', badge: 'Iklab · 2 lëvizje',
    name: 'Shndërrimi i N-së në M para B-së',
    desc: 'Kur nuni me sukun (نْ) ose tenvini (ً ٌ ٍ) pasohet menjëherë nga shkronja ب.',
    how: 'Shndërroje «n»-në në një «m» të butë duke i prekur buzët lehtë (pa i shtrënguar fort) me hundëzim 2 numërime para «b»-së. Shembull: مِنْ بَعْدِ → «mimmm-ba’di»; سَمٖیعٌ بَصٖیرٌ → «semî’ummm-besîr».',
  },
  {
    id: 'ikhfa', sym: 'إخفاء', badge: 'Ihfa · 2 lëvizje',
    name: 'Fshehja e N-së / M-së me hundëzim',
    desc: 'Nuni me sukun/tenvini para 15 shkronjave të Ihfasë (ت ث ج د ذ ز س ش ص ض ط ظ ف ق ك) dhe mimi me sukun para (ب).',
    how: 'Mos e mbështet gjuhën te qiellza për «n» të qartë — mbaje gjuhën gati për shkronjën pasuese dhe lësho një hundëzim të butë 2 numërime. Shembull: مِنْ قَبْلِكَ → «minnn-kablike» (me «n» të fshehur e të trashë para ق).',
  },
  {
    id: 'qalqalah', sym: 'ق ط ب ج د', badge: 'Kalkale · Jehonë',
    name: 'Jehonë e lehtë (ق ط ب ج د)',
    desc: 'Shkronjat ق، ط، ب، ج، د kur kanë sukun (ْ) ose kur ndalesh te to në fund të ajetit.',
    how: 'Shqiptoje shkronjën me një «kërcim» / jehonë të shkurtër pa shtuar zanore të plotë (a/e/i/u). Në mes të fjalës më lehtë (خَلَقْنَا → «halek-nâ»), kur ndalesh në fund më qartë (اَحَدٌ → «ehad»).',
  },
  {
    id: 'tafkhim', sym: 'ر · اللّٰه', badge: 'Tefhim · E trashë',
    name: 'R-ja e trashë & Llami i trashë te اللّٰه',
    desc: 'Shkronja ر kur ka fetha/damma (ose sukun pas fetha/damma), dhe emri اللّٰه kur paraprihet nga fetha/damma ose në fillim.',
    how: 'Ngrije pjesën e pasme të gjuhës dhe mbushe gojën me tingull të plotë e të rëndë (jo të hollë). Shembull: الرَّحْمٰنِ → «er-Rahmân»; قُلْ هُوَ اللّٰهُ → «All-llâhu» (e trashë), ndërsa بِسْمِ اللّٰهِ → «bil-lâhi» (e hollë, e pangjyrosur).',
  },
  {
    id: 'silent', sym: 'ال · ل ر', badge: 'E heshtur',
    name: 'Shkronjë që nuk shqiptohet',
    desc: 'Nuni/tenvini para (ل، ر) [Idgam pa gunneh], llami diellor para shedes (الرَّحْمٰنِ), hemzetul-vasli në lidhje, elifi pas «وا» (قَالُوا) dhe sifri (اُولٰٓئِكَ).',
    how: 'Kaloje plotësisht pa e lexuar këtë shkronjë dhe vazhdo drejt te shkronja tjetër. Shembull: مِنْ رَبِّهِمْ → «mir-rabbihim» (pa «n»); قَالُوا → «kâlû» (elifi i fundit nuk lexohet); الشَّمْسِ → «esh-shemsi» (pa «l»).',
  },
];

export const TAJWEED_BY_ID = Object.fromEntries(TAJWEED_RULES.map((r) => [r.id, r]));

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

// ── Texhvid i plotë offline (10 rregullat kryesore të Hafsit) ──
const AR_LETTER = /[\u0621-\u064a\u0671\u06a9\u06cc]/;
const AR_MARKS = /[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed\u08d0-\u08ff]/;
const TANWIN = /[\u064b\u064c\u064d]/;
const FATHA_DAMMA = /[\u064e\u064f\u064b\u064c\u0670]/;
const KASRA = /[\u0650\u064d\u0656\u06ea]/;
const VOWEL_OR_SHADDA = /[\u064b-\u0651\u0670]/;
const IDGHAM_GHUNNAH = /[ينمو\u06cc]/;
const IDGHAM_NO_GHUNNAH = /[لر]/;
const IKHFA_LETTERS = /[تثجدذزسشصضطظفقك]/;
const QALQALAH_LETTERS = /[قطبجد]/;
const ISTILA_RAA = /[صطق]/;
const MUTAJANIS = new Set(['دت', 'تد', 'تط', 'ذظ', 'ثذ', 'لر', 'قك', 'بم']);

function splitClusters(word) {
  const out = [];
  for (let i = 0; i < word.length; ) {
    const ch = word[i];
    if (AR_LETTER.test(ch)) {
      let j = i + 1;
      while (j < word.length && AR_MARKS.test(word[j])) j++;
      out.push({ base: ch, marks: word.slice(i + 1, j), text: word.slice(i, j) });
      i = j;
    } else {
      if (out.length) {
        out[out.length - 1].marks += ch;
        out[out.length - 1].text += ch;
      } else {
        out.push({ base: '', marks: ch, text: ch });
      }
      i++;
    }
  }
  return out;
}

function firstSoundLetter(clusters) {
  if (!clusters || !clusters.length) return '';
  const c0 = clusters[0];
  if (c0.base === 'ا' && !VOWEL_OR_SHADDA.test(c0.marks) && clusters.length > 1) return clusters[1].base;
  return c0.base;
}

function prevWordLastVowel(prevClusters) {
  if (!prevClusters || !prevClusters.length) return '';
  for (let k = prevClusters.length - 1; k >= 0; k--) {
    const m = prevClusters[k].marks;
    if (KASRA.test(m)) return 'i';
    if (FATHA_DAMMA.test(m)) return 'au';
  }
  return '';
}

function isHeavyAllahLam(clusters, i, prevClusters) {
  const c = clusters[i];
  if (c.base !== 'ل' || !c.marks.includes('\u0651') || !c.marks.includes('\u0670')) return false;
  if (i + 1 >= clusters.length || clusters[i + 1].base !== 'ه') return false;
  for (let k = i - 1; k >= 0; k--) {
    const m = clusters[k].marks;
    if (KASRA.test(m)) return false;
    if (FATHA_DAMMA.test(m)) return true;
  }
  return prevWordLastVowel(prevClusters) !== 'i';
}

function isHeavyRaa(clusters, i, prevClusters) {
  const c = clusters[i];
  if (c.base !== 'ر') return false;
  if (FATHA_DAMMA.test(c.marks)) return true;
  if (KASRA.test(c.marks)) return false;
  if (c.marks.includes('\u0652')) {
    const next = i + 1 < clusters.length ? clusters[i + 1] : null;
    if (next && ISTILA_RAA.test(next.base) && !KASRA.test(next.marks)) return true;
    for (let k = i - 1; k >= 0; k--) {
      const p = clusters[k];
      if (FATHA_DAMMA.test(p.marks)) return true;
      if (KASRA.test(p.marks)) return false;
      if (p.base === 'ي' || p.base === 'ی') return false;
    }
    return prevWordLastVowel(prevClusters) === 'au';
  }
  return false;
}

export function tajweedWordHTML(clusters, prevClusters, nextClusters, isLastWordOfAyah = false) {
  const rules = new Array(clusters.length).fill(null);
  for (let i = 0; i < clusters.length; i++) {
    const c = clusters[i];
    const prev = i > 0 ? clusters[i - 1] : null;
    const nextInWord = i + 1 < clusters.length ? clusters[i + 1] : null;
    const isLast = !nextInWord;
    const trailingAlif = nextInWord && i + 2 === clusters.length && (nextInWord.base === 'ا' || nextInWord.base === 'ى') && !VOWEL_OR_SHADDA.test(nextInWord.marks);
    const acrossWord = isLast || trailingAlif;
    const nextBase = !acrossWord ? nextInWord.base : firstSoundLetter(nextClusters);

    let rule = null;
    const hasSukun = c.marks.includes('\u0652');
    const hasShadda = c.marks.includes('\u0651');
    const hasTanwin = TANWIN.test(c.marks);
    const isNunSakin = c.base === 'ن' && (hasSukun || !VOWEL_OR_SHADDA.test(c.marks));
    const isMimSakin = c.base === 'م' && hasSukun;

    if (c.marks.includes('\u0653')) {
      // Medd Lazim (6) kur pasohet nga shede/sukun në të njëjtën fjalë (p.sh. الضَّٓالّٖینَ, آٰمّٖینَ) ose te shkronjat e ndara (الٓمٓ)
      const skipCarrier = nextInWord && /[اوي\u06ccل]/.test(nextInWord.base) && !VOWEL_OR_SHADDA.test(nextInWord.marks) && !nextInWord.marks.includes('\u0652');
      const afterMadd = skipCarrier ? (i + 2 < clusters.length ? clusters[i + 2] : null) : nextInWord;
      const lazim = (afterMadd && (afterMadd.marks.includes('\u0651') || afterMadd.marks.includes('\u0652')))
        || (!VOWEL_OR_SHADDA.test(c.marks) && !/[اوي\u06cc]/.test(c.base));
      rule = lazim ? 'madd-6' : 'madd';
    } else if (prev && (rules[i - 1] === 'madd-6' || rules[i - 1] === 'madd') && /[اوي\u06cc]/.test(c.base) && !VOWEL_OR_SHADDA.test(c.marks)) {
      rule = rules[i - 1]; // Zgjatja e bashkuar me shkronjën bartëse (ضَّٓا, مَٓا)
    } else if ((c.base === 'ن' || c.base === 'م') && hasShadda) {
      rule = 'ghunnah';
    } else if ((isNunSakin || hasTanwin) && nextBase) {
      if (nextBase === 'ب') rule = 'iqlab';
      else if (acrossWord && IDGHAM_GHUNNAH.test(nextBase)) rule = 'idgham';
      else if (acrossWord && IDGHAM_NO_GHUNNAH.test(nextBase)) rule = 'silent';
      else if (IKHFA_LETTERS.test(nextBase)) rule = 'ikhfa';
    } else if (isMimSakin && acrossWord && nextBase) {
      if (nextBase === 'م') rule = 'idgham';
      else if (nextBase === 'ب') rule = 'ikhfa';
    } else if (hasSukun && nextBase && !/[اوي\u06cc]/.test(c.base) && (
      (acrossWord && c.base === nextBase) || MUTAJANIS.has(c.base + nextBase)
    )) {
      rule = 'idgham';
    } else if (c.base === 'ل' && !hasSukun && !hasShadda && prev && prev.base === 'ا' && nextInWord && nextInWord.marks.includes('\u0651')) {
      rule = 'silent'; // Lam Shamsiyyah (الرَّحْمٰنِ، الشَّمْسِ)
    } else if (c.base === 'ا' && i === 0 && prevClusters && !VOWEL_OR_SHADDA.test(c.marks) && !c.marks.includes('\u0653')) {
      rule = 'silent'; // Hemzetul-vasl në lidhje
    } else if (c.base === 'ا' && isLast && !VOWEL_OR_SHADDA.test(c.marks) && prev && prev.base === 'و' && !FATHA_DAMMA.test(prev.marks)) {
      rule = 'silent'; // Elifi i heshtur pas "وا" (قَالُوا)
    } else if ((c.base === 'و' || c.base === 'ا') && (c.marks.includes('\u08d1') || c.marks.includes('\u06ec'))) {
      rule = 'silent'; // Sifr (اُو࣑لٰٓئِكَ)
    } else if (QALQALAH_LETTERS.test(c.base) && (hasSukun || (isLastWordOfAyah && isLast && !hasShadda))) {
      rule = 'qalqalah';
    } else if (isHeavyAllahLam(clusters, i, prevClusters)) {
      rule = 'tafkhim';
    } else if (c.base === 'ر' && isHeavyRaa(clusters, i, prevClusters)) {
      rule = 'tafkhim';
    } else if (c.marks.includes('\u0670') || (c.base === 'ه' && isLast && nextClusters && (c.marks.includes('\u0656') || c.marks.includes('\u06ea')))) {
      rule = 'madd-2';
    }
    rules[i] = rule;
  }

  let html = '';
  for (let i = 0; i < clusters.length; ) {
    const r = rules[i];
    let text = clusters[i].text;
    let j = i + 1;
    while (j < clusters.length && rules[j] === r) {
      text += clusters[j].text;
      j++;
    }
    html += r ? `<span class="tj-${r}">${escHTML(text)}</span>` : escHTML(text);
    i = j;
  }
  return html;
}

// Ndërton HTML-në e fjalëve arabe duke vënë fjalët me shenjë ndalimi/shqiptimi brenda <span class="wq"> dhe opsionalisht ngjyrat e Texhvidit.
export function renderArWords(text, mode = 'd', tajweed = false) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  const allClusters = tajweed ? words.map(splitClusters) : null;
  return words.map((w, idx) => {
    const pronId = detectPron(w);
    const waqfId = detectWaqf(w, mode);
    const primary = pronId || waqfId;
    const isEnd = idx === words.length - 1;
    if (primary) {
      const secondary = pronId && waqfId ? waqfId : null;
      const def = WAQF_DEFS[primary];
      const label = secondary ? `${def.badge} · ${WAQF_DEFS[secondary].badge}` : `${def.badge} — ${def.name}`;
      const inner = tajweed ? tajweedWordHTML(allClusters[idx], allClusters[idx - 1] || null, allClusters[idx + 1] || null, isEnd) : escHTML(w);
      return `<span class="wq" data-wq="${primary}"${secondary ? ` data-wq2="${secondary}"` : ''} data-cat="${def.cat}"${isEnd ? ' data-end="1"' : ''} tabindex="0" role="button" aria-label="${escHTML(label)}">${inner}</span>`;
    }
    if (tajweed) return tajweedWordHTML(allClusters[idx], allClusters[idx - 1] || null, allClusters[idx + 1] || null, isEnd);
    return escHTML(w);
  }).join(' ');
}
