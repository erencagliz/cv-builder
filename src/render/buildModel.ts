import type { CV, DateFormat, DateRange, Entry, Lang, SectionKey } from '../model/types';
import { SECTION_MAP } from '../model/sections';
import { LINK_MAP, displayLink, resolveLink } from '../model/links';
import fonts from './fonts.json';
import { iconSvg, sectionIconId, contactIconId } from './iconSvg';

/* ---------- Typst'e giden model ---------- */
export interface Seg { t: string; b?: boolean; i?: boolean }
export type Rich = Seg[];
export interface RenderRole { heading: string; date: string; sub: string; desc: Rich[]; bullets: Rich[]; tags: string; tagsLabel: string }
export interface RenderItem {
  heading: string;
  org: string;
  date: string;
  location: string;
  sub: string;
  url: string;
  urlText: string;
  desc: Rich[];
  bullets: Rich[];
  tags: string;
  tagsLabel: string;
  roles: RenderRole[];
}
export interface RenderLine { label: string; value: Rich }
export interface RenderSection {
  key: string;
  title: string;
  kind: 'text' | 'entries' | 'lines' | 'inline';
  icon?: string;
  paragraphs?: Rich[];
  items?: RenderItem[];
  lines?: RenderLine[];
}
export interface RenderLetter {
  place: string; // "İstanbul, 18 Ekim 2026"
  recipient: string[];
  subject: string;
  greeting: string;
  paragraphs: Rich[];
  closing: string;
  signature: string;
}
export interface RenderModel {
  kind: 'cv' | 'letter';
  letter?: RenderLetter;
  lang: Lang;
  meta: { title: string; author: string; keywords: string[]; subject: string };
  design: CV['design'] & { headingFamily: string; bodyFamily: string };
  header: { name: string; title: string; contacts: { text: string; url: string; icon: string; button: boolean }[]; photo: boolean };
  sections: RenderSection[];
  labels: { present: string };
}

/* ---------- Dil etiketleri ---------- */
const MONTHS: Record<Lang, { short: string[]; long: string[] }> = {
  tr: {
    short: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'],
    long: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'],
  },
  en: {
    short: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    long: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  },
};

const L = {
  tr: {
    present: 'Devam ediyor',
    birth: 'Doğum Tarihi',
    age: 'Yaş',
    nationality: 'Uyruk',
    military: 'Askerlik Durumu',
    license: 'Ehliyet',
    marital: 'Medeni Durum',
    travel: 'Seyahat Engeli',
    military_done: 'Yapıldı',
    military_exempt: 'Muaf',
    military_deferred: 'Tecilli',
    military_na: 'Yükümlü değil',
    discharged: 'terhis',
    until: 'tarihine kadar',
    single: 'Bekâr',
    married: 'Evli',
    travel_yes: 'Yok',
    travel_no: 'Var',
    gpa: 'Not ortalaması',
    tech: 'Teknolojiler',
    courses: 'İlgili dersler',
    credential: 'Sertifika No',
    expires: 'Geçerlilik',
    onRequest: 'Referanslar talep edildiğinde sunulacaktır.',
    role: 'Rol',
    authors: 'Yazarlar',
    cv: 'Özgeçmiş',
  },
  en: {
    present: 'Present',
    birth: 'Date of Birth',
    age: 'Age',
    nationality: 'Nationality',
    military: 'Military Service',
    license: "Driver's License",
    marital: 'Marital Status',
    travel: 'Travel Restrictions',
    military_done: 'Completed',
    military_exempt: 'Exempt',
    military_deferred: 'Deferred',
    military_na: 'Not applicable',
    discharged: 'discharged',
    until: 'until',
    single: 'Single',
    married: 'Married',
    travel_yes: 'None',
    travel_no: 'Yes',
    gpa: 'GPA',
    tech: 'Technologies',
    courses: 'Relevant coursework',
    credential: 'Credential ID',
    expires: 'Valid until',
    onRequest: 'References available upon request.',
    role: 'Role',
    authors: 'Authors',
    cv: 'Resume',
  },
};

const OPTION_LABELS: Record<string, Record<Lang, string>> = {
  fulltime: { tr: 'Tam zamanlı', en: 'Full-time' },
  parttime: { tr: 'Yarı zamanlı', en: 'Part-time' },
  intern: { tr: 'Staj', en: 'Internship' },
  freelance: { tr: 'Serbest', en: 'Freelance' },
  contract: { tr: 'Sözleşmeli', en: 'Contract' },
  onsite: { tr: 'Ofisten', en: 'On-site' },
  remote: { tr: 'Uzaktan', en: 'Remote' },
  hybrid: { tr: 'Hibrit', en: 'Hybrid' },
  highschool: { tr: 'Lise', en: 'High School' },
  associate: { tr: 'Ön Lisans', en: 'Associate Degree' },
  bachelor: { tr: 'Lisans', en: "Bachelor's Degree" },
  master: { tr: 'Yüksek Lisans', en: "Master's Degree" },
  phd: { tr: 'Doktora', en: 'PhD' },
  certificate: { tr: 'Sertifika Programı', en: 'Certificate Program' },
  exchange: { tr: 'Değişim Programı', en: 'Exchange Program' },
  native: { tr: 'Ana dil', en: 'Native' },
  advanced: { tr: 'İleri', en: 'Advanced' },
  intermediate: { tr: 'Orta', en: 'Intermediate' },
  beginner: { tr: 'Başlangıç', en: 'Beginner' },
  expert: { tr: 'Uzman', en: 'Expert' },
};
const opt = (v: unknown, lang: Lang) => {
  const k = str(v);
  return OPTION_LABELS[k]?.[lang] ?? k;
};

/* ---------- yardımcılar ---------- */
const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const arr = (v: unknown) => (Array.isArray(v) ? (v as unknown[]).map(str).filter(Boolean) : []);
const joinDot = (...p: string[]) => p.filter(Boolean).join(' · ');

export const upperTr = (s: string, lang: Lang) => s.toLocaleUpperCase(lang === 'tr' ? 'tr-TR' : 'en-US');

export function formatMonth(v: string, fmt: DateFormat, lang: Lang): string {
  const m = /^(\d{4})(?:-(\d{1,2}))?/.exec(v || '');
  if (!m) return '';
  const year = m[1];
  const month = m[2] ? parseInt(m[2], 10) : 0;
  if (!month || fmt === 'YYYY') return year;
  const mm = String(month).padStart(2, '0');
  switch (fmt) {
    case 'MMM YYYY':
      return `${MONTHS[lang].short[month - 1]} ${year}`;
    case 'MMMM YYYY':
      return `${MONTHS[lang].long[month - 1]} ${year}`;
    case 'MM/YYYY':
      return `${mm}/${year}`;
    case 'YYYY-MM':
      return `${year}-${mm}`;
  }
  return year;
}

export function formatRange(r: unknown, fmt: DateFormat, lang: Lang): string {
  if (!r || typeof r !== 'object') return '';
  const { start, end, current } = r as DateRange;
  const a = formatMonth(start, fmt, lang);
  const b = current ? L[lang].present : formatMonth(end, fmt, lang);
  if (a && b) return a === b ? a : `${a} – ${b}`;
  return a || b;
}

/** **kalın** ve *italik* sözdizimini parçalara ayırır */
export function parseRich(text: string): Rich {
  const out: Seg[] = [];
  const re = /(\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ t: text.slice(last, m.index) });
    if (m[2] !== undefined) out.push({ t: m[2], b: true });
    else out.push({ t: m[3], i: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ t: text.slice(last) });
  return out.filter((s) => s.t.length);
}

const paragraphs = (v: unknown): Rich[] =>
  str(v)
    .split(/\n\s*\n|\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(parseRich);

const bulletList = (v: unknown): Rich[] => arr(v).map(parseRich);

const emptyItem = (): RenderItem => ({
  heading: '',
  org: '',
  date: '',
  location: '',
  sub: '',
  url: '',
  urlText: '',
  desc: [],
  bullets: [],
  tags: '',
  tagsLabel: '',
  roles: [],
});

function ageFrom(date: string): string {
  const d = new Date(date);
  if (isNaN(+d)) return '';
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) a--;
  return String(a);
}

function formatBirth(date: string, fmt: CV['personal']['birthFormat'], lang: Lang): { label: string; value: string } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return null;
  if (fmt === 'year') return { label: L[lang].birth, value: m[1] };
  if (fmt === 'age') return { label: L[lang].age, value: ageFrom(date) };
  const day = parseInt(m[3], 10);
  const month = MONTHS[lang].long[parseInt(m[2], 10) - 1];
  return { label: L[lang].birth, value: lang === 'tr' ? `${day} ${month} ${m[1]}` : `${month} ${day}, ${m[1]}` };
}

export function fontFamily(id: string): string {
  return (fonts as { id: string; family: string }[]).find((f) => f.id === id)?.family ?? 'Source Sans 3';
}

export function sectionTitle(cv: CV, key: SectionKey): string {
  const custom = cv.titles[key];
  if (custom && custom.trim()) return custom.trim();
  if (key.startsWith('custom:')) return cv.custom.find((c) => `custom:${c.id}` === key)?.title || '';
  return SECTION_MAP[key as keyof typeof SECTION_MAP]?.title[cv.lang] ?? key;
}

/* ---------- bölüm dönüştürücüler ---------- */
function mapEntry(key: string, e: Entry, cv: CV): RenderItem {
  const { lang } = cv;
  const fmt = cv.design.dateFormat;
  const it = emptyItem();
  const date = (k = 'dates') => formatRange(e[k], fmt, lang);
  const month = (k: string) => formatMonth(str(e[k]), fmt, lang);
  const url = str(e.url) ? resolveLink('custom', str(e.url)) : '';
  if (url) {
    it.url = url;
    it.urlText = displayLink(url);
  }
  it.desc = paragraphs(e.description);
  it.bullets = bulletList(e.bullets);
  switch (key) {
    case 'experience':
      it.heading = str(e.position);
      it.org = str(e.company);
      it.location = str(e.location);
      it.date = date();
      it.sub = joinDot(opt(e.employmentType, lang), opt(e.workMode, lang));
      it.tags = arr(e.tags).join(', ');
      it.tagsLabel = L[lang].tech;
      break;
    case 'education': {
      it.heading = str(e.school);
      it.org = [opt(e.degree, lang), str(e.field)].filter(Boolean).join(', ');
      it.location = str(e.location);
      it.date = date();
      const gpa = str(e.gpa) ? `${L[lang].gpa}: ${str(e.gpa)}/${str(e.gpaScale) === '100' ? '100' : str(e.gpaScale) === '5' ? (lang === 'tr' ? '5,00' : '5.00') : lang === 'tr' ? '4,00' : '4.00'}` : '';
      it.sub = joinDot(gpa, str(e.honors));
      it.tags = arr(e.tags).join(', ');
      it.tagsLabel = L[lang].courses;
      break;
    }
    case 'certificates':
      it.heading = str(e.name);
      it.org = str(e.issuer);
      it.date = month('date');
      it.sub = joinDot(
        str(e.credentialId) ? `${L[lang].credential}: ${str(e.credentialId)}` : '',
        str(e.expires) ? `${L[lang].expires}: ${month('expires')}` : '',
      );
      break;
    case 'projects':
      it.heading = str(e.name);
      it.org = str(e.role);
      it.date = date();
      it.tags = arr(e.tags).join(', ');
      it.tagsLabel = L[lang].tech;
      break;
    case 'courses':
      it.heading = str(e.name);
      it.org = str(e.institution);
      it.date = month('date');
      it.sub = str(e.hours);
      break;
    case 'volunteer':
      it.heading = str(e.role);
      it.org = str(e.organization);
      it.location = str(e.location);
      it.date = date();
      break;
    case 'awards':
      it.heading = str(e.title);
      it.org = str(e.issuer);
      it.date = month('date');
      break;
    case 'publications':
      it.heading = str(e.title);
      it.org = str(e.publisher);
      it.date = month('date');
      it.sub = str(e.authors);
      break;
    case 'talks':
      it.heading = str(e.title);
      it.org = str(e.event);
      it.location = str(e.location);
      it.date = month('date');
      break;
    case 'memberships':
      it.heading = str(e.organization);
      it.org = str(e.role);
      it.date = date();
      break;
    case 'references':
      it.heading = str(e.name);
      it.org = [str(e.title), str(e.company)].filter(Boolean).join(', ');
      it.sub = joinDot(str(e.relation), str(e.email), str(e.phone));
      break;
    default: // özel bölüm
      it.heading = str(e.title);
      it.org = str(e.subtitle);
      it.location = str(e.location);
      it.date = date();
  }
  return it;
}

const hasContent = (it: RenderItem) => !!(it.heading || it.org || it.desc.length || it.bullets.length);

/** Aynı şirketteki ardışık pozisyonları tek başlık altında toplar. */
function groupRoles(items: RenderItem[], src: Entry[], cv: CV): RenderItem[] {
  const groups: { items: RenderItem[]; entries: Entry[] }[] = [];
  items.forEach((it, i) => {
    const g = groups[groups.length - 1];
    const company = it.org.toLocaleLowerCase('tr-TR');
    if (g && company && g.items[0].org.toLocaleLowerCase('tr-TR') === company) {
      g.items.push(it);
      g.entries.push(src[i]);
    } else groups.push({ items: [it], entries: [src[i]] });
  });
  return groups.map(({ items: gi, entries }) => {
    if (gi.length === 1) return gi[0];
    const toRole = (it: RenderItem): RenderRole => ({
      heading: it.heading,
      date: it.date,
      sub: it.sub,
      desc: it.desc,
      bullets: it.bullets,
      tags: it.tags,
      tagsLabel: it.tagsLabel,
    });
    // genel tarih aralığı: grubun en eski başlangıcı – en yeni bitişi (liste yeniden eskiye sıralı)
    const newest = entries[0].dates as DateRange | undefined;
    const oldest = entries[entries.length - 1].dates as DateRange | undefined;
    return {
      ...emptyItem(),
      heading: gi[0].org,
      location: gi[0].location,
      date: formatRange({ start: oldest?.start ?? '', end: newest?.end ?? '', current: !!newest?.current }, cv.design.dateFormat, cv.lang),
      roles: gi.map(toRole),
    };
  });
}

function personalLines(cv: CV): RenderLine[] {
  const p = cv.personal;
  const lang = cv.lang;
  const t = L[lang];
  const lines: RenderLine[] = [];
  const add = (label: string, value: string) => value && lines.push({ label, value: [{ t: value }] });
  if (!cv.international) {
    const b = formatBirth(p.birthDate, p.birthFormat, lang);
    if (b) add(b.label, b.value);
  }
  add(t.nationality, str(p.nationality));
  if (!cv.international && p.military) {
    let v = t[`military_${p.military}` as const];
    if (p.military === 'done' && p.militaryDate) v += ` (${t.discharged}: ${formatMonth(p.militaryDate, 'MMMM YYYY', lang)})`;
    if (p.military === 'deferred' && p.militaryDate)
      v += lang === 'tr' ? ` (${formatMonth(p.militaryDate, 'MMMM YYYY', lang)} ${t.until})` : ` (${t.until} ${formatMonth(p.militaryDate, 'MMMM YYYY', lang)})`;
    add(t.military, v);
  }
  if (p.licenses.length) add(t.license, p.licenses.join(', ') + (p.licenseYear ? ` (${p.licenseYear})` : ''));
  if (!cv.international && p.marital) add(t.marital, t[p.marital]);
  if (p.travel) add(t.travel, p.travel === 'yes' ? t.travel_yes : t.travel_no);
  return lines;
}

/* ---------- ana dönüştürücü ---------- */
export function buildModel(cv: CV): RenderModel {
  const { lang, design } = cv;
  const p = cv.personal;
  const name = [p.firstName, p.lastName].map(str).filter(Boolean).join(' ');
  const iconColor = design.icons.color === 'accent' ? design.colors.accent : design.icons.color === 'muted' ? design.colors.muted : design.colors.text;
  const cIcon = (kind: string) => (design.icons.contacts ? iconSvg(contactIconId(kind), iconColor) : '');
  const contacts: RenderModel['header']['contacts'] = [];
  if (str(p.location)) contacts.push({ text: str(p.location), url: '', icon: cIcon('location'), button: false });
  if (str(p.phone)) contacts.push({ text: str(p.phone), url: `tel:${str(p.phone).replace(/[^\d+]/g, '')}`, icon: cIcon('phone'), button: false });
  if (str(p.email)) contacts.push({ text: str(p.email), url: `mailto:${str(p.email)}`, icon: cIcon('email'), button: false });
  for (const l of cv.links) {
    const url = resolveLink(l.type, l.value);
    if (!url) continue;
    const label = l.type === 'custom' ? str(l.label) : LINK_MAP[l.type]?.name ?? '';
    let text: string;
    if (design.linkStyle === 'url') text = design.linkLabels && label ? `${label}: ${displayLink(url)}` : displayLink(url);
    else text = label || displayLink(url);
    contacts.push({ text, url, icon: cIcon(l.type), button: design.linkStyle === 'button' });
  }

  const sections: RenderSection[] = [];
  const hidden = new Set(cv.hidden);
  for (const key of cv.order) {
    if (hidden.has(key)) continue;
    let title = sectionTitle(cv, key);
    if (design.headingCase === 'upper') title = upperTr(title, lang);
    if (key === 'summary' || key === 'hobbies') {
      const paras = paragraphs(key === 'summary' ? cv.summary : cv.hobbies);
      if (paras.length) sections.push({ key, title, kind: 'text', paragraphs: paras });
    } else if (key === 'personal') {
      const lines = personalLines(cv);
      if (lines.length) sections.push({ key, title, kind: design.personalInline ? 'inline' : 'lines', lines });
    } else if (key === 'skills') {
      const lines = cv.sections.skills
        .map((e) => {
          const items = arr(e.items).join(', ');
          const level = str(e.level) ? ` (${opt(e.level, lang)})` : '';
          return { label: str(e.name), value: items ? [{ t: items + level }] : [] };
        })
        .filter((l) => l.value.length);
      if (lines.length) sections.push({ key, title, kind: 'lines', lines });
    } else if (key === 'languages') {
      const lines = cv.sections.languages
        .filter((e) => str(e.language))
        .map((e) => {
          const exam = [str(e.exam), str(e.score)].filter(Boolean).join(' ');
          return { label: str(e.language), value: [{ t: joinDot(opt(e.level, lang), exam) }] };
        });
      if (lines.length) sections.push({ key, title, kind: 'lines', lines });
    } else if (key === 'references') {
      if (cv.references.onRequest || !cv.references.items.length) {
        if (cv.references.onRequest) sections.push({ key, title, kind: 'text', paragraphs: [[{ t: L[lang].onRequest }]] });
      } else {
        const items = cv.references.items.map((e) => mapEntry('references', e, cv)).filter(hasContent);
        if (items.length) sections.push({ key, title, kind: 'entries', items });
      }
    } else if (key.startsWith('custom:')) {
      const c = cv.custom.find((x) => `custom:${x.id}` === key);
      if (!c) continue;
      const items = c.items.map((e) => mapEntry('custom', e, cv)).filter(hasContent);
      if (items.length) sections.push({ key, title, kind: 'entries', items });
    } else {
      const src = cv.sections[key as keyof CV['sections']] ?? [];
      let items = src.map((e) => mapEntry(key, e, cv));
      const kept = src.filter((_, i) => hasContent(items[i]));
      items = items.filter(hasContent);
      if (key === 'experience' && design.groupRoles) items = groupRoles(items, kept, cv);
      if (items.length) sections.push({ key, title, kind: 'entries', items });
    }
  }

  const secColor = design.headingColor === 'accent' ? design.colors.accent : design.colors.text;
  for (const sec of sections) sec.icon = design.icons.sections ? iconSvg(sectionIconId(cv.sectionIcons ?? {}, sec.key as SectionKey), secColor) : '';

  const keywords = cv.sections.skills.flatMap((e) => arr(e.items)).slice(0, 30);
  const displayName = design.nameCase === 'upper' ? upperTr(name, lang) : name;
  return {
    kind: 'cv',
    lang,
    meta: {
      title: name ? `${name} – ${L[lang].cv}` : L[lang].cv,
      author: name,
      keywords,
      subject: str(p.title),
    },
    design: { ...design, headingTracking: Math.min(Math.max(design.headingTracking, 0), 0.6), headingFamily: fontFamily(design.fonts.heading), bodyFamily: fontFamily(design.fonts.body) },
    header: { name: displayName, title: str(p.title), contacts, photo: !!(p.showPhoto && p.photo && !cv.international) },
    sections,
    labels: { present: L[lang].present },
  };
}

export function fileName(cv: CV, ext: string): string {
  const name = [cv.personal.firstName, cv.personal.lastName].join(' ').trim() || 'CV';
  const ascii = name
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'I')
    .replace(/ğ/g, 'g')
    .replace(/Ğ/g, 'G')
    .replace(/ş/g, 's')
    .replace(/Ş/g, 'S')
    .replace(/ç/g, 'c')
    .replace(/Ç/g, 'C')
    .replace(/ö/g, 'o')
    .replace(/Ö/g, 'O')
    .replace(/ü/g, 'u')
    .replace(/Ü/g, 'U')
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  return `${ascii || 'CV'}-${cv.lang === 'tr' ? 'CV' : 'Resume'}.${ext}`;
}

/* ---------- ön yazı ---------- */
const LETTER_L = {
  tr: { subject: 'Konu', application: 'pozisyonu için başvuru', greeting: 'Sayın Yetkili,', closing: 'Saygılarımla,', letter: 'Ön Yazı' },
  en: { subject: 'Subject', application: 'application', greeting: 'Dear Hiring Manager,', closing: 'Sincerely,', letter: 'Cover Letter' },
};

export function formatLongDate(iso: string, lang: Lang): string {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(iso + 'T12:00:00') : new Date();
  const month = MONTHS[lang].long[d.getMonth()];
  return lang === 'tr' ? `${d.getDate()} ${month} ${d.getFullYear()}` : `${month} ${d.getDate()}, ${d.getFullYear()}`;
}

export function buildLetterModel(cv: CV): RenderModel {
  const base = buildModel(cv);
  const L2 = LETTER_L[cv.lang];
  const cl = cv.coverLetter;
  const name = [cv.personal.firstName, cv.personal.lastName].map(str).filter(Boolean).join(' ');
  const place = [str(cl.city), formatLongDate(cl.date, cv.lang)].filter(Boolean).join(', ');
  const recipient = [str(cl.recipient), str(cl.company)].filter(Boolean);
  const subject = str(cl.position)
    ? cv.lang === 'tr'
      ? `${L2.subject}: ${str(cl.position)} ${L2.application}`
      : `${L2.subject}: ${str(cl.position)} ${L2.application}`
    : '';
  return {
    ...base,
    kind: 'letter',
    sections: [],
    meta: { ...base.meta, title: name ? `${name} – ${L2.letter}` : L2.letter },
    letter: {
      place,
      recipient,
      subject,
      greeting: str(cl.greeting) || L2.greeting,
      paragraphs: paragraphsBlank(cl.body),
      closing: str(cl.closing) || L2.closing,
      signature: name,
    },
  };
}

/** Ön yazıda paragraflar boş satırla ayrılır; tek satır sonu korunmaz */
function paragraphsBlank(v: string): Rich[] {
  return (v || '')
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean)
    .map(parseRich);
}
