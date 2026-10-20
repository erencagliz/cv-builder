/**
 * Herhangi bir CV'yi (PDF, Word, düz metin) yapıya çevirir — kural tabanlı, tamamen yerel.
 *
 * 1. Satırlar: PDF'te metin parçaları koordinatlarından satırlara toplanır, iki sütunlu düzen sezilir;
 *    büyük boşluklar sekme (\t) olur (sağa yaslı tarih, "Grup  yetenekler" gibi).
 * 2. Üst bilgi: ilk bölüm başlığından önceki satırlardan ad, unvan, e-posta, telefon, bağlantılar, konum.
 * 3. Bölümler: Türkçe/İngilizce başlık sözlüğüyle (harf aralıklı "D E N E Y İ M" dahil) ayrılır.
 * 4. Girdiler: tarih aralıkları ve madde işaretleri girdileri böler; aynı şirkette birden çok rol tanınır.
 */
import type { CV, DateRange, Entry, MilitaryStatus } from '../model/types';
import { emptyCV, newEntry, uid } from '../model/defaults';
import { formatPhone } from '../model/links';
import type { PdfText, TextItem } from '../ats/pdfText';

/* =============================== yardımcılar =============================== */
const fold = (t: string) =>
  t
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .replace(/[şŞ]/g, 's')
    .replace(/[ğĞ]/g, 'g')
    .replace(/[üÜ]/g, 'u')
    .replace(/[öÖ]/g, 'o')
    .replace(/[çÇ]/g, 'c')
    .replace(/[âÂ]/g, 'a')
    .replace(/[îÎ]/g, 'i')
    .replace(/[ûÛ]/g, 'u')
    .replace(/\s+/g, ' ')
    .trim();
/** Türkçe harfler \b'yi bozar: önce ASCII'ye katla, sonra ara */
const has = (re: RegExp, t: string) => re.test(fold(t));
/** Konumları koruyan katlama (dizinle orijinal metinden kesmek için) */
const foldKeep = (t: string) => [...t].map((ch) => (fold(ch) || ch).charAt(0) || ch).join('');
/** Parçanın tamamı bir konum mu? ("İstanbul", "Ataşehir, İstanbul") — "İstanbul Üniversitesi" değil */
const isCity = (t: string) => LOC_ONLY.test(fold(t).replace(/[()]/g, '').trim());
const clean = (t: string) => t.replace(/[  -​]/g, ' ').replace(/[ ]{2,}/g, ' ').trim();
const BULLET = /^\s*(?:[•●▪■◦○◆♦►▸➢✓✔\-–—*·]|\d{1,2}[.)])\s+/;
const isBullet = (l: string) => BULLET.test(l);
const stripBullet = (l: string) => l.replace(BULLET, '').trim();

/* =============================== tarih =============================== */
const MONTHS: Record<string, number> = {};
[
  ['ocak', 'oca', 'january', 'jan', 'januar'],
  ['subat', 'sub', 'february', 'feb', 'februar'],
  ['mart', 'mar', 'march', 'marz'],
  ['nisan', 'nis', 'april', 'apr'],
  ['mayis', 'may', 'mai'],
  ['haziran', 'haz', 'june', 'jun', 'juni'],
  ['temmuz', 'tem', 'july', 'jul', 'juli'],
  ['agustos', 'agu', 'august', 'aug'],
  ['eylul', 'eyl', 'september', 'sep', 'sept'],
  ['ekim', 'eki', 'october', 'oct', 'okt'],
  ['kasim', 'kas', 'november', 'nov'],
  ['aralik', 'ara', 'december', 'dec', 'dez'],
].forEach((names, i) => names.forEach((n) => (MONTHS[n] = i + 1)));

// Tarih eşleştirme ASCII'ye katlanmış metinde yapılır (Türkçe büyük İ / \b sorunları olmasın), kesim orijinal metinden
const MON = `(?:${Object.keys(MONTHS).sort((x, y) => y.length - x.length).join('|')})\\.?`;
const ONE_DATE = `(?:${MON}\\s*\\d{4}|\\d{1,2}\\s*[./-]\\s*\\d{4}|\\d{4}\\s*[./-]\\s*\\d{1,2}(?!\\d)|\\d{4})`;
const PRESENT = '(?:halen|gunumuz|devam ediyor|devam|su an(?:da)?|present|current|now|today|ongoing|heute)';
const RANGE_RE = new RegExp(`(?<![a-z0-9])(${ONE_DATE})\\s*(?:[-–—~]|to|\\bile\\b|'?(?:den|dan|ten|tan)\\b)\\s*(${ONE_DATE}|${PRESENT})(?![a-z0-9])`);
const SINGLE_RE = new RegExp(`(?:^|[\\s(,·|])(${ONE_DATE})(?=$|[\\s),·|])`);
const kfold = (t: string) => [...t].map((ch) => (ch.toLocaleLowerCase('tr-TR').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/’/g, "'") || ch).charAt(0)).join('');

function parseOne(t: string): string {
  const s = fold(t).replace(/\./g, ' ').trim();
  let m = /^([a-z]{3,9})\s*(\d{4})$/.exec(s);
  if (m && MONTHS[m[1]]) return `${m[2]}-${String(MONTHS[m[1]]).padStart(2, '0')}`;
  m = /^(\d{1,2})\s*[/-]?\s*(\d{4})$/.exec(t.replace(/\s/g, '').replace(/\./g, '/'));
  if (m && +m[1] >= 1 && +m[1] <= 12) return `${m[2]}-${m[1].padStart(2, '0')}`;
  m = /^(\d{4})[./-](\d{1,2})$/.exec(t.replace(/\s/g, ''));
  if (m && +m[2] >= 1 && +m[2] <= 12) return `${m[1]}-${m[2].padStart(2, '0')}`;
  m = /(\d{4})/.exec(t);
  return m && +m[1] > 1950 && +m[1] < 2100 ? m[1] : '';
}

/** Satırdaki tarih aralığını bulur ve satırdan çıkarır */
export function takeRange(line: string): { range: DateRange | null; rest: string } {
  const m = RANGE_RE.exec(kfold(line));
  if (m) {
    const start = parseOne(m[1]);
    const isNow = new RegExp(`^${PRESENT}$`, 'i').test(m[2].trim());
    const end = isNow ? '' : parseOne(m[2]);
    if (start) return { range: { start, end, current: isNow }, rest: cut(line, m.index, m[0].length) };
  }
  return { range: null, rest: line };
}
function takeSingle(line: string): { date: string; rest: string } {
  const m = SINGLE_RE.exec(kfold(line));
  if (m) {
    const d = parseOne(m[1]);
    if (d) {
      const at = m.index + m[0].indexOf(m[1]);
      return { date: d, rest: cut(line, at, m[1].length) };
    }
  }
  return { date: '', rest: line };
}
function cut(line: string, at: number, len: number) {
  return (line.slice(0, at) + ' ' + line.slice(at + len))
    .replace(/\(\s*[·,|-]?\s*/g, '(')
    .replace(/\s*[·,|-]?\s*\)/g, ')')
    .replace(/\(\s*\)/g, '')
    .replace(/\s*[|·]\s*$/g, '')
    .replace(/^\s*[|·,–-]\s*/, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\t\s*$/, '')
    .trim();
}

/* =============================== başlıklar =============================== */
type Key =
  | 'summary' | 'experience' | 'education' | 'skills' | 'languages' | 'certificates' | 'projects' | 'courses' | 'volunteer'
  | 'awards' | 'publications' | 'talks' | 'memberships' | 'references' | 'hobbies' | 'personal' | 'contact';
const HEADS: Record<Key, string[]> = {
  summary: ['profil', 'ozet', 'hakkimda', 'kariyer hedefi', 'kariyer ozeti', 'profesyonel ozet', 'kisisel ozet', 'ozgecmis ozeti', 'summary', 'profile', 'professional summary', 'about', 'about me', 'objective', 'career objective', 'executive summary'],
  experience: ['is deneyimi', 'deneyim', 'deneyimler', 'is tecrubesi', 'is tecrubeleri', 'tecrube', 'tecrubeler', 'mesleki deneyim', 'profesyonel deneyim', 'calisma gecmisi', 'is gecmisi', 'experience', 'work experience', 'professional experience', 'employment history', 'employment', 'work history', 'career history'],
  education: ['egitim', 'egitim bilgileri', 'egitim durumu', 'ogrenim', 'ogrenim bilgileri', 'education', 'academic background', 'educational background', 'academic history'],
  skills: ['yetenekler', 'beceriler', 'yetkinlikler', 'teknik yetenekler', 'teknik beceriler', 'bilgisayar bilgisi', 'bilgisayar becerileri', 'uzmanlik alanlari', 'skills', 'technical skills', 'core competencies', 'competencies', 'key skills', 'expertise', 'tools', 'technologies'],
  languages: ['yabanci diller', 'yabanci dil', 'diller', 'dil bilgisi', 'languages', 'language skills'],
  certificates: ['sertifikalar', 'sertifikalar ve belgeler', 'belgeler', 'lisanslar ve sertifikalar', 'certificates', 'certifications', 'licenses & certifications', 'licenses and certifications'],
  projects: ['projeler', 'proje', 'projects', 'personal projects', 'selected projects'],
  courses: ['kurslar', 'kurslar ve egitimler', 'egitimler', 'seminerler', 'kurs ve seminerler', 'aldigim egitimler', 'courses', 'training', 'trainings'],
  volunteer: ['gonullu calismalar', 'gonulluluk', 'gonullu deneyim', 'sosyal sorumluluk', 'volunteering', 'volunteer experience', 'volunteer'],
  awards: ['oduller', 'oduller ve basarilar', 'basarilar', 'awards', 'honors', 'honors & awards', 'achievements'],
  publications: ['yayinlar', 'makaleler', 'publications'],
  talks: ['konferanslar', 'konusmalar', 'konferans ve konusmalar', 'talks', 'presentations', 'conferences'],
  memberships: ['uyelikler', 'dernek uyelikleri', 'memberships', 'affiliations', 'professional memberships'],
  references: ['referanslar', 'referans', 'references'],
  hobbies: ['hobiler', 'ilgi alanlari', 'hobiler ve ilgi alanlari', 'interests', 'hobbies'],
  personal: ['kisisel bilgiler', 'kisisel', 'personal details', 'personal information'],
  contact: ['iletisim', 'iletisim bilgileri', 'contact', 'contact information'],
};
const HEAD_MAP = new Map<string, Key>();
for (const [k, list] of Object.entries(HEADS)) for (const h of list) HEAD_MAP.set(h, k as Key);

export function headingKey(line: string): Key | null {
  let t = line.trim();
  if (t.length > 48 || isBullet(t)) return null;
  // "D E N E Y İ M" → "DENEYİM"
  if (/^(\S\s){3,}\S$/.test(t)) t = t.replace(/\s/g, '');
  const f = fold(t).replace(/[:：.\s]+$/, '').replace(/^[#\d.)\s]+/, '');
  return HEAD_MAP.get(f) ?? null;
}

/* =============================== satır üretimi =============================== */
/** pdf.js parçalarından satırlar; iki sütunlu düzeni sezer */
export function pdfLines(pdf: PdfText): string[] {
  const out: string[] = [];
  const pages = new Map<number, TextItem[]>();
  for (const it of pdf.items) if (it.str.trim()) pages.set(it.page, [...(pages.get(it.page) ?? []), it]);
  for (const items of pages.values()) {
    const W = pdf.pageWidth;
    // sütun aralığı: dikeyde neredeyse hiçbir parçanın kesmediği x
    let split: number | null = null;
    let best = Infinity;
    for (let x = W * 0.22; x <= W * 0.6; x += 4) {
      const crossing = items.filter((i) => i.x < x - 1 && i.x + i.width > x + 1).length;
      const left = items.filter((i) => i.x + i.width <= x).length;
      const right = items.filter((i) => i.x >= x).length;
      if (left > items.length * 0.15 && right > items.length * 0.25 && crossing < items.length * 0.06 && crossing < best) {
        // sol taraf gerçekten ayrı bir sütun mu? (sağdaki satırların çoğu sol taraf boşken de devam etmeli)
        const leftYs = new Set(items.filter((i) => i.x + i.width <= x).map((i) => Math.round(i.y)));
        const rightYs = new Set(items.filter((i) => i.x >= x).map((i) => Math.round(i.y)));
        const shared = [...rightYs].filter((y) => leftYs.has(y)).length;
        if (shared < rightYs.size * 0.5) {
          best = crossing;
          split = x;
        }
      }
    }
    const groups: TextItem[][] = split === null ? [items] : [items.filter((i) => i.x < split! - 1 && i.x + i.width > split! + 1), items.filter((i) => i.x + i.width <= split! + 1 && !(i.x < split! - 1 && i.x + i.width > split! + 1)), items.filter((i) => i.x >= split! - 1 && !(i.x < split! - 1 && i.x + i.width > split! + 1))];
    if (split !== null) {
      // sütunu kesen (tam genişlik) satırlar en üstteyse onları başa al; sonra ad/iletişim hangi sütundaysa o
      const [full, left, right] = groups;
      const order = left.length && right.length && Math.max(...left.map((i) => i.y)) > Math.max(...right.map((i) => i.y)) + 20 ? [full, left, right] : [full, right, left];
      for (const g of order) out.push(...linesOf(g));
    } else out.push(...linesOf(items));
  }
  return out.map(clean).filter(Boolean).filter((l) => !/^(page|sayfa)\s*\d+(\s*(of|\/)\s*\d+)?$/i.test(l));
}
function linesOf(items: TextItem[]): string[] {
  const rows: { y: number; items: TextItem[] }[] = [];
  for (const it of [...items].sort((a, b) => b.y - a.y || a.x - b.x)) {
    const row = rows.find((r) => Math.abs(r.y - it.y) <= Math.max(2, it.size * 0.35));
    if (row) row.items.push(it);
    else rows.push({ y: it.y, items: [it] });
  }
  rows.sort((a, b) => b.y - a.y);
  return rows.map((r) => {
    r.items.sort((a, b) => a.x - b.x);
    let s = '';
    let end = -1;
    for (const it of r.items) {
      const gap = it.x - end;
      if (end >= 0) {
        if (gap > Math.max(14, it.size * 1.6)) s += '\t';
        else if (gap > it.size * 0.12 && !s.endsWith(' ') && !it.str.startsWith(' ')) s += ' ';
      }
      s += it.str;
      end = it.x + it.width;
    }
    return s.replace(/ *\t */g, '\t');
  });
}

/** .docx → satırlar (paragraf başına bir satır; liste paragrafları "• " ile) */
export async function docxLines(data: Uint8Array): Promise<string[]> {
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(data);
  const xml = await zip.file('word/document.xml')?.async('string');
  if (!xml) throw new Error('Word dosyası okunamadı.');
  const out: string[] = [];
  const paras = xml.match(/<w:p[ >][\s\S]*?<\/w:p>/g) ?? [];
  const decode = (s: string) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
  for (const p of paras) {
    let t = '';
    for (const m of p.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>|<w:tab\/>|<w:br\/>/g)) {
      if (m[0] === '<w:tab/>') t += '\t';
      else if (m[0] === '<w:br/>') t += '\n';
      else t += decode(m[1]);
    }
    const list = /<w:numPr>/.test(p) || /<w:pStyle w:val="(?:ListBullet|ListParagraph|Liste)/.test(p);
    for (const part of t.split('\n')) {
      const c = part.trim();
      if (c) out.push(list && !isBullet(c) ? `• ${c}` : c);
    }
  }
  return out.map((l) => clean(l.replace(/ *\t */g, '\t'))).filter(Boolean);
}

export const textLines = (t: string) => t.split(/\r?\n/).map((l) => clean(l.replace(/ *\t */g, '\t'))).filter(Boolean);

/* =============================== alan tanıma =============================== */
const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/;
const PHONE = /(?:\+\d{1,3}[\s.-]?)?(?:\(?0?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{2}[\s.-]?\d{2}\b/;
const URL = /\b(?:https?:\/\/)?(?:www\.)?(?:[a-z0-9-]+\.)+(?:com|net|org|io|dev|me|app|co|tr|edu|info|ai|design|page|site|xyz)(?:\.[a-z]{2})?(?:\/[^\s,;|·)]*)?/gi;
const CITIES = 'istanbul|ankara|izmir|bursa|antalya|kocaeli|konya|adana|gaziantep|mersin|kayseri|eskisehir|diyarbakir|samsun|denizli|sakarya|tekirdag|trabzon|manisa|balikesir|mugla|aydin|hatay|malatya|erzurum|van|edirne|canakkale|bolu|duzce|zonguldak|ordu|rize|sivas|yalova|kirklareli|london|berlin|amsterdam|munich|munchen|paris|dubai|remote|uzaktan';
const LOC_ONLY = new RegExp(`^(?:[a-z.-]+, ?)?(?:${CITIES})(?:, ?(?:turkiye|turkey|tr|uk|germany|almanya))?$`);
const CITY_RE = new RegExp(`(?:^|[\\s,·|/])((?:[A-ZÇĞİÖŞÜ][\\wçğıöşü.-]+,\\s*)?(?:${CITIES}))(?:[\\s,·|/]|$)`, 'i');

/** Yalnızca şirket adında geçen ipuçları (unvanlarda da geçen "yazılım, lojistik" gibi kelimeler bilerek yok) */
const COMPANY_HINT = /(\ba\.?\s?s\.?(?=\s|$|,)|\bltd\b|\bsti\b|\binc\b|\bllc\b|\bgmbh\b|\bcorp\b|\bholding\b|\bgroup\b|\bgrup\b|\bbankasi\b|\bbank\b|hastanesi\b|belediyesi\b|bakanligi\b|universitesi\b|\bvakfi\b|\bdernegi\b|\bsan\.?\s?ve\s?tic\b|\bajansi\b|\bagency\b|\bconsulting\b|\btechnologies\b)/;
/** Unvanlarda geçen kelimeler */
const TITLE_HINT = /\b(uzman\w*|muhendis\w*|gelistirici\w*|yonetici\w*|mudur\w*|sorumlu\w*|asistan\w*|stajyer|sef\w*|temsilci\w*|danisman\w*|koordinator\w*|analist\w*|tasarimci\w*|teknisyen\w*|operator\w*|ogretmen\w*|memur\w*|elemani|specialist|engineer|developer|manager|analyst|consultant|coordinator|designer|intern|assistant|director|lead|officer|representative|administrator|technician|architect|head of)\b/;
const SCHOOL_HINT = /(universite|university|lise|lisesi|high school|okul|school|fakulte|faculty|college|kolej|institute|enstitu|akademi|academy|\bmyo\b|meslek yuksekokulu|yuksekokul)/;
const DEGREE_WORDS: [RegExp, string][] = [
  [/(doktora|ph\.?\s?d|doctorate)/, 'phd'],
  [/(yuksek lisans|master|\bmba\b|m\.?sc\b|\bm\.?a\.?\b)/, 'master'],
  [/(on ?lisans|associate|meslek yuksekokulu|\bmyo\b)/, 'associate'],
  [/(\blisans\b|bachelor|b\.?sc\b|\bb\.?a\.?\b|b\.?eng\b)/, 'bachelor'],
  [/(\blise\b|lisesi|high school)/, 'highschool'],
  [/(sertifika programi|certificate program)/, 'certificate'],
];
/** Yalnızca derece adından oluşan parça (alan değil) */
const DEGREE_ONLY = /^(on ?lisans|lisans|yuksek lisans|doktora|lise|associate'?s?( degree)?|bachelor'?s?( degree)?|master'?s?( degree)?|ph\.?\s?d\.?|bsc|b\.sc\.?|msc|m\.sc\.?|ba|ma|mba|beng)$/;
const EMP: [RegExp, string][] = [
  [/\b(tam zamanli|full[- ]time)\b/, 'fulltime'],
  [/\b(yari zamanli|part[- ]time)\b/, 'parttime'],
  [/\b(stajyer|staj|intern(ship)?)\b/, 'internship'],
  [/\b(serbest|freelance|kendi hesabima)\b/, 'freelance'],
  [/\b(sozlesmeli|contract)\b/, 'contract'],
];
/** Yalnızca çalışma tipi/şekli yazan parça ("Tam zamanlı", "Hibrit") — "Stajyer" gibi unvanlar değil */
const WORK_ONLY = /^(tam zamanli|yari zamanli|full[- ]time|part[- ]time|staj|internship|serbest|freelance|sozlesmeli|contract|hibrit|hybrid|uzaktan|remote|ofisten|on[- ]site)$/;
const MODE: [RegExp, string][] = [
  [/\b(uzaktan|remote)\b/, 'remote'],
  [/\b(hibrit|hybrid)\b/, 'hybrid'],
  [/\b(ofisten|on[- ]site|yerinde)\b/, 'onsite'],
];
const LANGS = 'turkce|ingilizce|almanca|fransizca|ispanyolca|italyanca|rusca|arapca|japonca|cince|korece|farsca|kurtce|portekizce|felemenkce|hollandaca|yunanca|bulgarca|azerice|gurcuce|ukraynaca|lehce|isvecce|english|turkish|german|french|spanish|italian|russian|arabic|japanese|chinese|korean|persian|kurdish|portuguese|dutch|greek';
const LANG_RE = new RegExp(`^(${LANGS})\\b`);
const LEVELS: [RegExp, string][] = [
  [/\b(ana ?dil|anadil|native|mother tongue|bilingual)\b/, 'native'],
  [/\bc2\b|\b(proficient|uzman)\b/, 'C2'],
  [/\bc1\b|\b(ileri|advanced|fluent|akici|cok iyi)\b/, 'C1'],
  [/\bb2\b|\b(upper[- ]intermediate|orta ustu|iyi|good)\b/, 'B2'],
  [/\bb1\b|\b(intermediate|orta)\b/, 'B1'],
  [/\ba2\b|\b(elementary|temel|basic)\b/, 'A2'],
  [/\ba1\b|\b(beginner|baslangic)\b/, 'A1'],
];
const EXAMS = /\b(YDS|YÖKDİL|YOKDIL|IELTS|TOEFL(?: iBT)?|TOEIC|PTE|Cambridge|Goethe|DELF|DALF|TestDaF|Duolingo)\b\s*[:\-–]?\s*([\d.,]+)?/i;

/** Başlık satırından pozisyon / kurum ayırımı */
function splitHead(t: string): string[] {
  return t
    .replace(/\s*\(([^()]*)\)/g, '\t$1')
    .split(/\t|\s+[|·•]\s+|\s+[–—-]\s+|\s+@\s+|\s+at\s+|,\s+(?=[A-ZÇĞİÖŞÜ])/)
    .map((p) => p.replace(/^[(\s]+|[)\s]+$/g, '').trim())
    .filter((p) => p && !/^[·|,–-]$/.test(p));
}

/* =============================== ana çözümleyici =============================== */
export interface ParseResult {
  cv: CV;
  found: string[];
  /** 0-1 arası: ne kadarının tanınabildiği */
  confidence: number;
}

export function parseResume(rawLines: string[], lang?: 'tr' | 'en'): ParseResult {
  const cv = emptyCV('İçe aktarılan CV');
  const lines = rawLines.map(clean).filter(Boolean);
  const textAll = lines.join('\n');
  cv.lang = lang ?? (/\b(experience|education|skills|summary|present)\b/i.test(textAll) && !/(deneyim|eğitim|yetenek|özet)/i.test(textAll) ? 'en' : 'tr');
  cv.order = [];
  const found = new Set<string>();

  // bölümlere ayır
  const parts: { key: Key | 'header' | 'custom'; title: string; lines: string[] }[] = [{ key: 'header', title: '', lines: [] }];
  for (const l of lines) {
    const k = headingKey(l);
    if (k) parts.push({ key: k, title: l, lines: [] });
    else if (
      parts.length > 1 &&
      l.length <= 32 &&
      /^[A-ZÇĞİÖŞÜ0-9 &/]+$/.test(l) &&
      /[A-ZÇĞİÖŞÜ]{3}/.test(l) &&
      !EMAIL.test(l)
    )
      parts.push({ key: 'custom', title: l, lines: [] }); // tanınmayan BÜYÜK HARFLİ başlık
    else parts[parts.length - 1].lines.push(l);
  }
  // başlık bulunamadıysa düz metin: hepsini üst bilgi + özet say
  const header = parts[0].lines;

  /* ---------- üst bilgi ---------- */
  const all = [header, ...parts.filter((p) => p.key === 'contact' || p.key === 'personal').map((p) => p.lines)].flat().join('\n');
  const email = EMAIL.exec(all)?.[0] ?? EMAIL.exec(textAll)?.[0] ?? '';
  if (email) {
    cv.personal.email = email;
    found.add('e-posta');
  }
  const phone = PHONE.exec(all.replace(EMAIL, ''))?.[0] ?? '';
  if (phone) {
    cv.personal.phone = formatPhone(phone) || phone.trim();
    found.add('telefon');
  }
  const urls = [...new Set([...(all.match(URL) ?? []), ...(textAll.match(/(?:linkedin\.com\/in|github\.com)\/[^\s,;|·)]+/gi) ?? [])])].filter((u) => !u.includes('@') && !email.endsWith(u));
  for (const u of urls.slice(0, 6)) {
    const low = u.toLowerCase();
    const type = low.includes('linkedin.com') ? 'linkedin' : low.includes('github.com') ? 'github' : low.includes('behance') ? 'behance' : low.includes('dribbble') ? 'dribbble' : low.includes('medium.com') ? 'medium' : 'website';
    if (cv.links.some((l) => l.type === type && type !== 'website')) continue;
    cv.links.push({ id: uid(), type, value: u.replace(/^https?:\/\/(www\.)?/i, ''), label: '' });
  }
  if (cv.links.length) found.add('bağlantılar');
  // ad ve unvan: iletişim olmayan ilk iki kısa satır
  const plainHead = header
    .flatMap((l) => l.split('\t'))
    .map((l) => l.trim())
    .filter((l) => l && !EMAIL.test(l) && !PHONE.test(l) && !(l.match(URL)?.length) && !/^(cv|özgeçmiş|ozgecmis|resume|curriculum vitae)$/i.test(l));
  const nameIdx = plainHead.findIndex((l) => /^[\p{Lu}][\p{L}'’.-]+(\s+[\p{L}'’.-]+){1,3}$/u.test(l) && l.split(/\s+/).length <= 4 && !has(COMPANY_HINT, l) && !isCity(l));
  if (nameIdx >= 0) {
    const parts2 = plainHead[nameIdx].split(/\s+/);
    const tc = (w: string) => (w === w.toLocaleUpperCase('tr-TR') && w.length > 1 ? w.charAt(0) + w.slice(1).toLocaleLowerCase('tr-TR') : w);
    cv.personal.lastName = tc(parts2.pop()!);
    cv.personal.firstName = parts2.map(tc).join(' ');
    found.add('ad soyad');
    const t = plainHead.slice(nameIdx + 1).find((l) => l.length <= 70 && !isCity(l) && !/[.!?]$/.test(l) && l.split(/\s+/).length <= 8);
    if (t) {
      cv.personal.title = t.replace(/^(unvan|title)\s*:\s*/i, '');
      found.add('unvan');
    }
  }
  const headJoined = [...header, ...parts.filter((p) => p.key === 'contact').flatMap((p) => p.lines)].map((l) => l.replace(/\t/g, ' · ')).join(' · ');
  const city = CITY_RE.exec(foldKeep(headJoined));
  if (city) {
    const at = city.index + city[0].indexOf(city[1]);
    cv.personal.location = headJoined.slice(at, at + city[1].length).replace(/^[,·|\s]+/, '').trim();
  }
  // üst bilgideki uzun paragraf → özet
  const headPara = header.filter((l) => l.length > 120 || (l.split(/\s+/).length > 14 && /[.]$/.test(l)));

  /* ---------- bölümler ---------- */
  const sectionsFound: string[] = [];
  const pushOrder = (k: string) => {
    if (!cv.order.includes(k as never)) cv.order.push(k as never);
  };
  for (const p of parts.slice(1)) {
    const L = joinWrapped(p.lines);
    if (!L.length && p.key !== 'references') continue;
    switch (p.key) {
      case 'summary': {
        cv.summary = [cv.summary, L.map((l) => stripBullet(l)).join(' ')].filter(Boolean).join('\n\n');
        pushOrder('summary');
        sectionsFound.push('özet');
        break;
      }
      case 'experience':
      case 'volunteer':
      case 'projects': {
        const items = parseEntries(L, p.key);
        if (items.length) {
          (cv.sections[p.key] as Entry[]).push(...items);
          pushOrder(p.key);
          sectionsFound.push(p.key === 'experience' ? `${items.length} deneyim` : p.key === 'projects' ? 'projeler' : 'gönüllülük');
        }
        break;
      }
      case 'education': {
        const items = parseEntries(L, 'education');
        if (items.length) {
          cv.sections.education.push(...items);
          pushOrder('education');
          sectionsFound.push('eğitim');
        }
        break;
      }
      case 'skills': {
        const groups = parseSkills(L);
        if (groups.length) {
          cv.sections.skills.push(...groups);
          pushOrder('skills');
          sectionsFound.push(`${groups.reduce((n, g) => n + (g.items as string[]).length, 0)} yetenek`);
        }
        break;
      }
      case 'languages': {
        const items = parseLanguages(L);
        if (items.length) {
          cv.sections.languages.push(...items);
          pushOrder('languages');
          sectionsFound.push('diller');
        }
        break;
      }
      case 'certificates':
      case 'courses':
      case 'awards':
      case 'publications':
      case 'talks':
      case 'memberships': {
        const items = parseSimple(L, p.key);
        if (items.length) {
          (cv.sections[p.key] as Entry[]).push(...items);
          pushOrder(p.key);
          sectionsFound.push(p.key === 'certificates' ? 'sertifikalar' : p.key === 'courses' ? 'kurslar' : p.title.toLocaleLowerCase('tr-TR'));
        }
        break;
      }
      case 'references': {
        const text = L.join(' ');
        if (!L.length || has(/talep|request|istenildiginde|istendiginde|upon/, text)) cv.references.onRequest = true;
        else
          for (const l of L) {
            const segs = splitHead(stripBullet(l));
            const em = EMAIL.exec(l)?.[0] ?? '';
            const ph = PHONE.exec(l)?.[0] ?? '';
            if (segs[0] && !EMAIL.test(segs[0])) cv.references.items.push(newEntry({ name: segs[0], title: segs[1] && !EMAIL.test(segs[1]) ? segs[1] : '', company: segs[2] && !EMAIL.test(segs[2]) && !PHONE.test(segs[2]) ? segs[2] : '', email: em, phone: ph }));
          }
        pushOrder('references');
        sectionsFound.push('referanslar');
        break;
      }
      case 'hobbies': {
        cv.hobbies = L.map(stripBullet).join(', ').split(/\s*[,;•·|]\s*/).filter(Boolean).join(', ');
        pushOrder('hobbies');
        break;
      }
      case 'personal':
      case 'contact': {
        parsePersonal(L.join(' · '), cv);
        if (p.key === 'personal') {
          pushOrder('personal');
          sectionsFound.push('kişisel bilgiler');
        }
        break;
      }
      case 'custom': {
        const items = parseEntries(L, 'custom');
        const id = uid();
        cv.custom.push({ id, title: p.title.charAt(0) + p.title.slice(1).toLocaleLowerCase('tr-TR'), items: items.length ? items : [newEntry({ title: '', description: L.join('\n') })] });
        cv.order.push(`custom:${id}` as never);
        break;
      }
    }
  }
  // kişisel bilgiler bazen başlıksız üstte yer alır
  parsePersonal(header.join(' · '), cv);
  if (!cv.summary && headPara.length) {
    cv.summary = headPara.join(' ');
    sectionsFound.unshift('özet');
  }
  if (cv.summary) pushOrder('summary');
  // standart sırayı tamamla (boş bölümler görünmez)
  for (const k of emptyCV().order) pushOrder(k);
  cv.order.sort((a, b) => (a === 'summary' ? -1 : b === 'summary' ? 1 : 0));

  const parts3 = [...found, ...sectionsFound];
  const confidence = Math.min(1, (found.has('ad soyad') ? 0.2 : 0) + (cv.personal.email ? 0.15 : 0) + (cv.sections.experience.length ? 0.25 : 0) + (cv.sections.education.length ? 0.15 : 0) + (cv.sections.skills.length ? 0.15 : 0) + (cv.summary ? 0.1 : 0));
  return { cv, found: parts3, confidence };
}

/** PDF'te satır sonlarında kırılan maddeleri ve paragrafları birleştirir */
function joinWrapped(lines: string[]): string[] {
  const out: string[] = [];
  for (const raw of lines) {
    const l = raw.trim();
    const prev = out[out.length - 1];
    const continuation =
      prev !== undefined &&
      !isBullet(l) &&
      !l.includes('\t') &&
      !takeRange(l).range &&
      !/:\s*\S/.test(l.slice(0, 30)) &&
      !/^[^:]{2,30}:\s/.test(prev) &&
      !prev.includes('\t') &&
      !(has(TITLE_HINT, l) && l.split(/\s+/).length <= 6 && /^\p{Lu}/u.test(l)) &&
      (/^[a-zçğıöşü(%&,;0-9]/.test(l) || (isBullet(prev) && !/[.!?:;]$/.test(prev) && l.length < 140) || (!isBullet(prev) && prev.length > 70 && !/[.!?:;]$/.test(prev))) &&
      !takeRange(prev).range;
    if (continuation) out[out.length - 1] = `${prev} ${l}`.replace(/(\p{L})- (\p{Ll})/gu, '$1$2');
    else out.push(l);
  }
  return out;
}

function detect<T extends string>(t: string, list: [RegExp, T][]): T | '' {
  const f = fold(t);
  return list.find(([re]) => re.test(f))?.[1] ?? '';
}

/** Deneyim / eğitim / proje / özel bölüm girdileri */
function parseEntries(lines: string[], kind: 'experience' | 'education' | 'projects' | 'volunteer' | 'custom'): Entry[] {
  type Raw = { head: string[]; range: DateRange | null; bullets: string[]; desc: string[]; meta: string[] };
  const raws: Raw[] = [];
  let cur: Raw | null = null;
  const start = () => {
    cur = { head: [], range: null, bullets: [], desc: [], meta: [] };
    raws.push(cur);
    return cur;
  };
  for (const l of lines) {
    const { range, rest } = takeRange(l);
    const bullet = isBullet(l);
    let c = cur as Raw | null;
    if (bullet) {
      (c ?? start()).bullets.push(stripBullet(l));
      continue;
    }
    if (/^(teknolojiler|technologies|kullanılan teknolojiler|araçlar|tools|tech stack|ilgili dersler|relevant coursework)\s*:/i.test(l)) {
      (c ?? start()).meta.push(l);
      continue;
    }
    if (/^(not ortalaması|gpa|ortalama|gano)\s*:/i.test(l)) {
      (c ?? start()).meta.push(l);
      continue;
    }
    const hasBody = !!c && (c.bullets.length > 0 || c.desc.length > 0);
    if (range) {
      // tarih satırı: yeni girdi mi, mevcut girdinin tarihi mi?
      if (!c || hasBody || (c.range && rest)) c = start();
      if (!c.range) c.range = range;
      else c = Object.assign(start(), { range });
      // tarih satırının geri kalanı: konum / çalışma tipi → meta, gerisi başlık
      for (const part of splitHead(rest)) {
        if (WORK_ONLY.test(fold(part)) || /^(not ortalamasi|gpa|ortalama|gano)\b/.test(fold(part)) || (isCity(part) && part.split(/\s+/).length <= 3)) c.meta.push(part);
        else c.head.push(part);
      }
      continue;
    }
    const looksHead = l.length <= 90 && (!/[.!?]$/.test(l) || (l.split(/\s+/).length <= 6 && !/[!?]$/.test(l))) && l.split(/\s+/).length <= 12;
    if (!c || (hasBody && looksHead)) c = start();
    if (looksHead && !c.bullets.length && (c.head.length < 3 || !c.desc.length) && !(c.desc.length && !c.head.length)) {
      if (l.split(/\t|\s+[·|]\s+|,\s+/).every((x) => WORK_ONLY.test(fold(x.trim())) || isCity(x))) c.meta.push(l);
      else c.head.push(l);
    } else c.desc.push(l);
  }

  // ortak şirket altında roller: başlığı olup tarihi/gövdesi olmayan girdi + ardından tarihli roller
  const out: Entry[] = [];
  let parentCompany = '';
  let parentLoc = '';
  let lastCompany = '';
  for (let i = 0; i < raws.length; i++) {
    const r = raws[i];
    const next = raws[i + 1];
    if (kind === 'experience' && r.range && !r.bullets.length && !r.desc.length && next?.range && next.head.length === 1 && !has(COMPANY_HINT, next.head[0])) {
      // "Şirket (tarih)" üst girdisi
      const segs = r.head.flatMap(splitHead);
      parentCompany = segs[0] ?? '';
      parentLoc = segs.find((s) => isCity(s)) ?? '';
      continue;
    }
    if (!r.head.length && !r.bullets.length && !r.desc.length) continue;
    const segs = r.head.flatMap(splitHead).filter((s) => !WORK_ONLY.test(fold(s)));
    const metaSegs = r.meta.flatMap((m) => m.split(/\t|\s+[·|]\s+/)).map((x) => x.trim());
    const loc = [...segs, ...metaSegs].find((s) => isCity(s) && s.split(/\s+/).length <= 3 && !has(COMPANY_HINT, s) && !has(SCHOOL_HINT, s)) ?? '';
    const rest = segs.filter((s) => s !== loc);
    const metaText = [...r.meta, ...r.head].join(' ');
    const tagsLine = r.meta.find((m) => /^(teknolojiler|technologies|kullanılan teknolojiler|araçlar|tools|tech stack|ilgili dersler|relevant coursework)\s*:/i.test(m));
    const tags = tagsLine ? tagsLine.replace(/^[^:]+:\s*/, '').split(/\s*[,;•·|]\s*/).filter(Boolean) : [];
    const dates = r.range ?? { start: '', end: '', current: false };
    if (kind === 'education') {
      const school = rest.find((s) => has(SCHOOL_HINT, s)) ?? rest[0] ?? '';
      const others = rest.filter((s) => s !== school);
      const degree = detect([...others, school].join(' '), DEGREE_WORDS);
      const field =
        others
          .filter((s) => !DEGREE_ONLY.test(fold(s).replace(/[.,]$/, '')))
          .map((s) => s.replace(/^(?:BSc|B\.Sc\.?|MSc|M\.Sc\.?|BA|MA|MBA|BEng|Bachelor of (?:Science|Arts) in|Master of (?:Science|Arts) in)\s+/i, '').trim())
          .find((s) => s.length > 1) ?? '';
      const gpa = /(?:not ortalaması|gpa|ortalama|gano)\s*:?\s*([\d.,]+)\s*(?:\/\s*([\d.,]+))?/i.exec(metaText);
      out.push(
        newEntry({
          school,
          degree,
          field,
          location: loc,
          gpa: gpa?.[1] ?? '',
          gpaScale: gpa?.[2] ? (gpa[2].startsWith('100') ? '100' : gpa[2].startsWith('5') ? '5' : '4') : '',
          dates,
          description: r.desc.join('\n'),
          bullets: r.bullets,
          tags: tags,
        }),
      );
    } else if (kind === 'experience' || kind === 'volunteer') {
      let position = rest[0] ?? '';
      let company = rest[1] ?? parentCompany;
      if (rest.length > 2) {
        // "Stajyer – Sistem Destek – Mavi Yazılım": şirket ipucu taşıyan parça ya da sonuncusu şirkettir
        const ci = rest.findIndex((x) => has(COMPANY_HINT, x));
        const at = ci >= 0 ? ci : rest.length - 1;
        company = rest[at];
        position = rest.filter((_, i) => i !== at).join(' – ');
      } else if (rest.length === 2) {
        const [a, b] = rest;
        const swap = (has(COMPANY_HINT, a) && !has(COMPANY_HINT, b)) || (has(TITLE_HINT, b) && !has(TITLE_HINT, a));
        if (swap) [position, company] = [b, a];
      }
      if (rest.length === 1) {
        // tek parça: unvan mı şirket mi? Şirketse pozisyon yok; değilse önceki girdinin şirketinden devral (aynı şirkette rol değişikliği)
        if (has(COMPANY_HINT, rest[0]) && !has(TITLE_HINT, rest[0])) [position, company] = ['', rest[0]];
        else company = parentCompany || (kind === 'experience' && !r.range ? '' : lastCompany);
      }
      const e = newEntry({
        dates,
        bullets: r.bullets,
        description: r.desc.join('\n'),
        tags,
        location: loc || (company === parentCompany ? parentLoc : ''),
      });
      if (kind === 'experience') Object.assign(e, { position, company, employmentType: detect(metaText, EMP), workMode: detect(metaText, MODE) });
      else Object.assign(e, { role: position, organization: company });
      out.push(e);
      lastCompany = company;
      if (!r.range || company !== parentCompany) parentCompany = '';
    } else if (kind === 'projects') {
      const url = (r.head.join(' ').match(URL) ?? [])[0] ?? '';
      out.push(newEntry({ name: rest[0] ?? '', role: rest[1] && !URL.test(rest[1]) ? rest[1] : '', url, dates, description: r.desc.join('\n'), bullets: r.bullets, tags }));
      URL.lastIndex = 0;
    } else {
      out.push(newEntry({ title: rest[0] ?? '', subtitle: rest.slice(1).join(' · '), location: loc, dates, description: r.desc.join('\n'), bullets: r.bullets }));
    }
  }
  return out;
}

function parseSkills(lines: string[]): Entry[] {
  const groups: Entry[] = [];
  const loose: string[] = [];
  const split = (t: string) =>
    t
      .split(/\s*[,;•·|]\s*|\s{2,}|\t/)
      .map((x) => x.replace(/^[-–*]\s*/, '').replace(/\s*\((?:ileri|orta|başlangıç|advanced|intermediate|beginner|expert|uzman)\)\s*$/i, '').trim())
      .filter((x) => x && x.length <= 48);
  const structured = lines.some((raw) => /^([^:\t]{2,32})\s*[:\t]\s*\S/.test(stripBullet(raw)));
  for (const raw of lines) {
    const l = stripBullet(raw);
    const m = /^([^:\t]{2,32})\s*[:\t]\s*(.+)$/.exec(l);
    if (m && split(m[2]).length >= 1 && !/^https?$/i.test(m[1])) groups.push(newEntry({ name: m[1].trim(), level: '', items: split(m[2]) }));
    else {
      // aynı bölümde "Grup  öğeler" düzeni varsa, sekmesi kaybolmuş satırın ilk kelimesi grup adıdır ("Araçlar PowerShell, …")
      const first = l.split(/\s*,\s*/)[0];
      // etiket: büyük harfle başlayan kelime + küçük harfli devamı ("Müşteri hizmetleri"), öğeler büyük harfle başlar
      const w = /^(\p{Lu}[\p{L}/&-]*(?:\s+\p{Ll}[\p{L}/&-]*){0,2})\s+(\p{Lu}.*)$/u.exec(first);
      if (structured && w && l.includes(',')) groups.push(newEntry({ name: w[1], level: '', items: split(l.slice(w[1].length)) }));
      else loose.push(...split(l));
    }
  }
  if (loose.length) groups.push(newEntry({ name: groups.length ? 'Diğer' : '', level: '', items: [...new Set(loose)] }));
  return groups.filter((g) => (g.items as string[]).length);
}

function parseLanguages(lines: string[]): Entry[] {
  const out: Entry[] = [];
  for (const raw of lines.flatMap((l) => (l.split(/\s*[,;]\s*/).every((p) => LANG_RE.test(fold(p))) ? l.split(/\s*[,;]\s*/) : [l]))) {
    const l = stripBullet(raw).replace(/\t/g, ' ');
    const m = LANG_RE.exec(fold(l));
    if (!m) continue;
    const word = l.slice(0, m[1].length);
    const name = word.charAt(0).toLocaleUpperCase('tr-TR') + word.slice(1).toLocaleLowerCase('tr-TR');
    const rest = l.slice(m[1].length);
    const ex = EXAMS.exec(rest);
    out.push(newEntry({ language: name, level: detect(rest, LEVELS as [RegExp, string][]), exam: ex?.[1] ?? '', score: ex?.[2]?.replace(/[.,]$/, '') ?? '' }));
  }
  return out;
}

function parseSimple(lines: string[], key: 'certificates' | 'courses' | 'awards' | 'publications' | 'talks' | 'memberships'): Entry[] {
  const out: Entry[] = [];
  for (const raw of lines) {
    const l = stripBullet(raw);
    const { range, rest: r1 } = takeRange(l);
    const { date, rest } = range ? { date: range.start, rest: r1 } : takeSingle(l);
    const segs = splitHead(rest);
    if (!segs.length) continue;
    // önceki girdinin açıklama satırı mı?
    if (out.length && /^[a-zçğıöşü]/.test(rest) && !date) {
      const prev = out[out.length - 1];
      prev.description = [prev.description, rest].filter(Boolean).join(' ');
      continue;
    }
    const [a, b] = [segs[0], segs.slice(1).join(' · ')];
    const e =
      key === 'certificates'
        ? newEntry({ name: a, issuer: b, date })
        : key === 'courses'
          ? newEntry({ name: a, institution: b, date })
          : key === 'awards'
            ? newEntry({ title: a, issuer: b, date })
            : key === 'publications'
              ? newEntry({ title: a, publisher: b, date })
              : key === 'talks'
                ? newEntry({ title: a, event: b, date })
                : newEntry({ organization: a, role: b, dates: range ?? { start: date, end: '', current: false } });
    out.push(e);
  }
  return out;
}

function parsePersonal(text: string, cv: CV) {
  const p = cv.personal;
  const f = fold(text);
  const birth = /(?:dogum tarihi|dogum yili|birth date|date of birth|d\.?\s?tarihi)\s*:?\s*(\d{1,2}[./-]\d{1,2}[./-]\d{4}|\d{4})/i.exec(f);
  if (birth && !p.birthDate) {
    const m = /(\d{1,2})[./-](\d{1,2})[./-](\d{4})/.exec(birth[1]);
    p.birthDate = m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : `${birth[1]}-01-01`;
    p.birthFormat = m ? 'full' : 'year';
  }
  const mil = /(?:askerlik(?: durumu)?|military(?: service)?)\s*:?\s*([a-z ]{3,20})/i.exec(f);
  if (mil && !p.military) {
    const v = mil[1];
    const st: MilitaryStatus = /yapildi|tamam|done|completed|terhis/.test(v) ? 'done' : /muaf|exempt/.test(v) ? 'exempt' : /tecil|ertele|deferred/.test(v) ? 'deferred' : '';
    if (st) p.military = st;
  }
  const lic = /(?:ehliyet|surucu belgesi|driver'?s licen[cs]e|driving licen[cs]e)\s*:?\s*([a-z0-9, ]{1,20})/i.exec(f);
  if (lic && !p.licenses.length) {
    const cls = (lic[1].toUpperCase().match(/\b(A1|A2|A|B1|BE|B|C1E|C1|CE|C|D1E|D1|DE|D|F|G|M)\b/g) ?? []).filter((x, i, arr) => arr.indexOf(x) === i);
    if (cls.length) p.licenses = cls;
  }
  if (/medeni (?:hal|durum)\w*\s*:?\s*evli|marital status\s*:?\s*married/.test(f)) p.marital = 'married';
  else if (/medeni (?:hal|durum)\w*\s*:?\s*bekar|marital status\s*:?\s*single/.test(f)) p.marital = 'single';
  if (/seyahat (?:engeli|durumu)\s*:?\s*(yok|bulunmamaktadir)/.test(f)) p.travel = 'yes';
  const nat = /(?:uyruk|uyrugu|nationality)\s*:?\s*([a-z.]+)/i.exec(f);
  if (nat && !p.nationality) p.nationality = /t\.?c|turk/.test(nat[1]) ? (cv.lang === 'en' ? 'Turkish' : 'T.C.') : nat[1];
}

/* =============================== dosya girişi =============================== */
export async function parseResumeFile(file: File): Promise<ParseResult & { kind: string }> {
  const name = file.name.toLowerCase();
  const data = new Uint8Array(await file.arrayBuffer());
  if (name.endsWith('.pdf') || file.type === 'application/pdf') {
    const { extractPdfText } = await import('../ats/pdfText');
    const pdf = await extractPdfText(data);
    if (pdf.text.replace(/\s/g, '').length < 40) throw new Error('Bu PDF’te seçilebilir metin yok (taranmış görüntü olabilir). Word ya da metin olarak kaydedip tekrar dene.');
    // LinkedIn dışa aktarımı ise özel çözümleyiciyi kullan
    if (/^(contact|iletişim|iletisim)\b/im.test(pdf.text.slice(0, 200)) && /linkedin\.com\/in\//i.test(pdf.text)) {
      const { parseLinkedIn } = await import('./linkedin');
      const r = parseLinkedIn(pdf);
      return { cv: r.cv, found: r.found, confidence: 0.9, kind: 'LinkedIn PDF' };
    }
    return { ...parseResume(pdfLines(pdf)), kind: 'PDF' };
  }
  if (name.endsWith('.docx')) return { ...parseResume(await docxLines(data)), kind: 'Word' };
  if (name.endsWith('.doc')) throw new Error('Eski .doc biçimi okunamıyor. Word’de “Farklı kaydet → .docx” ile kaydedip tekrar dene.');
  if (name.endsWith('.txt') || name.endsWith('.md') || file.type.startsWith('text/')) return { ...parseResume(textLines(new TextDecoder().decode(data))), kind: 'metin' };
  throw new Error('Desteklenen biçimler: PDF, Word (.docx) ve düz metin (.txt).');
}
