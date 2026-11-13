import type { CV, DateRange, Entry, Lang } from '../model/types';
import type { RenderModel } from '../render/buildModel';
import { isValidEmail, resolveLink, displayLink } from '../model/links';
import { isStandardTitle, SECTION_MAP } from '../model/sections';
import { contrast } from '../editor/contrast';
import { totalExperienceMonths } from './quality';
import { detectRole, fold, KW_EN, type Role } from './roles';
import { matchJob } from './keywords';
import { unicodeWords } from './unicodeWord';

export type CategoryId = 'parse' | 'impact' | 'complete' | 'keywords' | 'layout';
export type Level = 'ok' | 'warn' | 'error' | 'info';
export interface Target {
  section: string;
  entryId?: string;
}
export interface FindingItem {
  text: string;
  where?: string;
  note?: string;
  target?: Target;
  keyword?: string;
}
export interface Finding {
  id: string;
  cat: CategoryId;
  level: Level;
  title: string;
  detail?: string;
  weight: number;
  earned: number;
  target?: Target;
  items?: FindingItem[];
  critical?: boolean;
}
export interface BulletScore {
  text: string;
  score: number;
  where: string;
  target: Target;
  verb: 'strong' | 'active' | 'nominal' | 'gerund' | 'passive' | 'weak' | 'none';
  metric: boolean;
  result: boolean;
  words: number;
  tips: string[];
}
export interface CategoryScore {
  id: CategoryId;
  label: string;
  desc: string;
  weight: number;
  score: number;
}
export interface Report {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'E';
  verdict: string;
  categories: CategoryScore[];
  findings: Finding[];
  fixes: Finding[];
  bullets: BulletScore[];
  role: Role | null;
  stats: { words: number; pages: number; bullets: number; months: number; seniority: Seniority; metricRatio: number; avgBullet: number };
  capped: boolean;
}
export type Seniority = 'entry' | 'mid' | 'senior';

export const CATEGORIES: { id: CategoryId; label: string; desc: string; weight: number }[] = [
  { id: 'parse', label: 'ATS okunabilirliği', desc: 'PDF’in metni bir ATS’nin yaptığı gibi geri okunur.', weight: 0.2 },
  { id: 'impact', label: 'Etki ve içerik', desc: 'Maddeler ne yaptığını ve sonucunu ölçülebilir anlatıyor mu?', weight: 0.35 },
  { id: 'complete', label: 'Bütünlük', desc: 'İletişim, bölümler ve her girdinin zorunlu alanları.', weight: 0.2 },
  { id: 'keywords', label: 'Anahtar kelimeler', desc: 'ATS filtrelerinin aradığı yetenek ve terimler.', weight: 0.15 },
  { id: 'layout', label: 'Düzen ve uzunluk', desc: 'Kıdemine uygun uzunluk, kronoloji ve tutarlılık.', weight: 0.1 },
];

const s = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const norm = (t: string) => t.toLocaleLowerCase('tr-TR').replace(/[‐-―]/g, '-').replace(/\s+/g, ' ').trim();
const plain = (t: string) => t.replace(/\*\*?|__/g, '').trim();
const ym = (v: string) => {
  const m = /^(\d{4})(?:-(\d{2}))?/.exec(v || '');
  return m ? parseInt(m[1], 10) * 12 + (m[2] ? parseInt(m[2], 10) - 1 : 0) : null;
};
const nowYm = () => {
  const d = new Date();
  return d.getFullYear() * 12 + d.getMonth();
};
const words = (t: string) => (t.match(/[\p{L}\p{N}][\p{L}\p{N}'’.+#/-]*/gu) ?? []).length;
const esc = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const pct = (n: number) => `%${Math.round(n * 100)}`;
const bulletsOf = (e: Entry) => (Array.isArray(e.bullets) ? (e.bullets as string[]).map((b) => plain(String(b))).filter(Boolean) : []);

export function hasTerm(foldedText: string, term: string): boolean {
  const k = fold(term).trim();
  if (!k) return false;
  const variants = new Set([k, k.replace(/[\s-]+/g, ''), k.replace(/\s+/g, '-')]);
  for (const v of variants) if (new RegExp(`(^|[^a-z0-9#+])${esc(v)}`).test(foldedText)) return true;
  return false;
}

const STRONG_TR = [
  'yonet', 'kur', 'gelistir', 'tasarla', 'olustur', 'azalt', 'artir', 'hizlandir', 'otomatiklestir', 'iyilestir', 'coz', 'egit', 'buyut',
  'kazandir', 'kazan', 'baslat', 'donustur', 'tasi', 'entegre', 'optimize', 'analiz', 'raporla', 'sun', 'muzakere', 'denetle', 'planla',
  'koordine', 'liderlik', 'gecir', 'tamamla', 'teslim', 'kodla', 'olc', 'standartlastir', 'sadelestir', 'dusur', 'indir', 'kisalt',
  'kurgula', 'yurut', 'uygula', 'gerceklestir', 'elde', 'guncelle', 'modernize', 'yapilandir', 'dagit', 'tasarruf', 'acti', 'devreye',
  'hazirla', 'yaz', 'yayinla', 'ac', 'genislet', 'bagla', 'kapat', 'onle', 'giderdim', 'gider', 'sagla', 'belgele', 'test', 'mentorluk',
  'yonlendir', 'isle', 'devral', 'cikar', 'tamamlat', 'surdur', 'hayata', 'imzala', 'kapattim', 'topla', 'ikna',
];
const STRONG_EN = new Set(
  `led managed directed coordinated planned supervised mentored built developed designed created launched implemented engineered architected
  reduced increased accelerated automated improved streamlined optimized cut boosted doubled tripled grew expanded scaled resolved delivered
  trained documented negotiated presented secured won saved generated drove spearheaded established introduced migrated integrated deployed
  analyzed modernized standardized simplified restructured revamped rebuilt shipped owned authored published achieved exceeded closed earned
  oversaw orchestrated pioneered transformed consolidated audited forecasted identified eliminated prevented recruited coached`
    .split(/\s+/)
    .filter(Boolean),
);
const WEAK_TR = unicodeWords(/\bsorumlu(yd|ydu)?(um|m)?\b|\bgörev (aldım|yaptım)\b|\byardımcı oldum\b|\byardım ettim\b|\bilgilendim\b|\bçalıştım\b|\bbulundum\b|\bkatkıda bulundum\b|\bdestek oldum\b|\byer aldım\b|\bkatıldım\b/i);
const WEAK_EN = /^(responsible|helped|assisted|worked|participated|involved|handled|tasked|duties|in charge)\b|\bresponsible for\b/i;
const VAGUE_TR = unicodeWords(/\b(çeşitli|bazı|vb\.|vs\.|vb|vs|birçok|pek çok|gibi işler|ve benzeri)(?!\w)/i);
const VAGUE_EN = /\b(various|several|etc\.?|numerous|many|some|stuff|things)\b/i;
const RESULT_TR = unicodeWords(/\b(sayesinde|sonucunda|oranında|tasarruf|kazanç|kazandırarak|artış|düşüş|azalma)\b|\p{L}+(arak|erek)\b|\bile\b.*\b\p{L}+(dım|dim|dum|düm|tım|tim|tum|tüm)\b/iu);
const RESULT_EN = /\b(resulting in|leading to|which|saving|increasing|reducing|improving|achieving|enabling|by \w+ing|so that|cutting)\b/i;
const NUMBER_WORD = unicodeWords(/\b(iki|üç|dört|beş|altı|yedi|sekiz|dokuz|on|yüz|bin|milyon|milyar|yarı|kat|katına|double|doubled|triple|tripled|half|twice|thousand|million|billion|hundred)\b/i);

export function hasMetric(t: string): boolean {
  const withoutYears = t.replace(/\b(19|20)\d{2}\b/g, '');
  return /\d/.test(withoutYears) || /[%₺$€£]/.test(t) || NUMBER_WORD.test(t);
}

function classifyVerb(t: string, lang: Lang): BulletScore['verb'] {
  const clean = t.replace(/[.!;:,)\]"”’]+$/g, '').trim();
  if (lang === 'en') {
    if (WEAK_EN.test(clean)) return 'weak';
    const first = fold(clean.split(/\s+/)[0] ?? '').replace(/[^a-z-]/g, '');
    if (STRONG_EN.has(first)) return 'strong';
    if (/ed$/.test(first)) return 'active';
    if (/ing$/.test(first)) return 'gerund';
    if (/^(was|were|been|is|are)$/.test(first)) return 'passive';
    return 'none';
  }
  if (WEAK_TR.test(clean)) return 'weak';
  const ws = clean.split(/\s+/);
  const last = fold(ws[ws.length - 1] ?? '');
  const prev = fold(ws[ws.length - 2] ?? '');
  if (/(il|ul|in|un|n)d[iu]$/.test(last) && last.length > 4) return 'passive';
  const active = /[dt][iu]m$|[dt][iu]k$|iyorum$|uyorum$|yorum$|[dt][iu]g[iu]m$/.test(last);
  const strongHit = STRONG_TR.some((st) => last.startsWith(st) || ((last === 'ettim' || last === 'ettik' || last === 'getirdim' || last === 'aldim') && prev.startsWith(st)));
  if (active && strongHit) return 'strong';
  if (active) return 'active';
  if (/(ma|me|masi|mesi|mak|mek|lik|lugu|ligi|leri|lari)$/.test(last)) return 'nominal';
  return 'none';
}

const VERB_POINTS: Record<BulletScore['verb'], number> = { strong: 25, active: 19, nominal: 13, gerund: 12, none: 8, passive: 6, weak: 0 };

export function scoreBullet(text: string, lang: Lang): Omit<BulletScore, 'where' | 'target'> {
  const t = plain(text);
  const verb = classifyVerb(t, lang);
  const metric = hasMetric(t);
  const result = (lang === 'tr' ? RESULT_TR : RESULT_EN).test(t);
  const w = words(t);
  const tips: string[] = [];
  let score = VERB_POINTS[verb];
  if (verb === 'weak') tips.push(lang === 'tr' ? 'Pasif kalıp (“sorumluydum, görev aldım”). Ne yaptığını güçlü bir fiille anlat: yönettim, kurdum, azalttım.' : 'Passive phrase. Start with a strong verb: led, built, reduced.');
  else if (verb === 'passive') tips.push(lang === 'tr' ? 'Edilgen anlatım (“yapıldı, sağlandı”). Etken yaz: “yaptım, sağladım”.' : 'Passive voice. Write it actively.');
  else if (verb === 'none' || verb === 'gerund') tips.push(lang === 'tr' ? 'Cümle bir eylemle bitmiyor. Sonuna ne yaptığını söyleyen fiili koy (…kurdum, …azalttım).' : 'Start with an action verb (Built…, Reduced…).');

  if (metric) score += 30;
  else tips.push(lang === 'tr' ? 'Ölçü yok: kaç kişi, yüzde kaç, ne kadar sürede, ne kadar tutar?' : 'No metric: how many, what percent, how fast, how much?');
  if (result) score += 15;
  else if (metric) score += 7;
  else tips.push(lang === 'tr' ? 'Sonucu göster: “…sayesinde”, “…ederek … azalttım”.' : 'Show the outcome: “…, resulting in …”.');

  if (w >= 8 && w <= 32) score += 15;
  else if (w >= 5 && w <= 42) {
    score += 8;
    tips.push(w < 8 ? (lang === 'tr' ? 'Kısa: bağlamı ve sonucu ekle.' : 'Short: add context and result.') : lang === 'tr' ? 'Uzun: 1-2 satıra indir.' : 'Long: trim to 1-2 lines.');
  } else tips.push(w < 5 ? (lang === 'tr' ? 'Çok kısa; tek başına bir şey anlatmıyor.' : 'Too short.') : lang === 'tr' ? 'Çok uzun; ikiye böl.' : 'Too long; split it.');

  let clean = 15;
  if ((lang === 'tr' ? VAGUE_TR : VAGUE_EN).test(t)) {
    clean -= 7;
    tips.push(lang === 'tr' ? 'Belirsiz ifade (“çeşitli, bazı, vb.”). Somut örnek ver.' : 'Vague word; be specific.');
  }
  if ((lang === 'tr' && /\b(ben|benim)\b/i.test(t)) || (lang === 'en' && /^(i|my)\b/i.test(t))) {
    clean -= 5;
    tips.push(lang === 'tr' ? '“Ben” demene gerek yok.' : 'Drop “I”.');
  }
  if (findCliches(t, lang).length) {
    clean -= 5;
    tips.push(lang === 'tr' ? 'Klişe ifade; yerine kanıt koy.' : 'Cliché; show evidence instead.');
  }
  score += Math.max(0, clean);
  return { text: t, score: Math.min(100, score), verb, metric, result, words: w, tips };
}

const CLICHES: Record<Lang, string[]> = {
  tr: [
    'takım oyuncusu', 'takım çalışmasına yatkın', 'ekip çalışmasına yatkın', 'çalışkan', 'dinamik', 'sonuç odaklı', 'hedef odaklı', 'çözüm odaklı',
    'iletişimi güçlü', 'iletişim becerisi yüksek', 'iletişim becerileri güçlü', 'öğrenmeye açık', 'stres altında çalışabilen', 'yoğun tempoya',
    'detaylara önem veren', 'detaycı', 'motivasyonu yüksek', 'disiplinli', 'azimli', 'kendini geliştirmeye', 'yenilikçi', 'vizyoner', 'çok yönlü',
    'sorumluluk sahibi', 'pozitif', 'güler yüzlü', 'özverili', 'mükemmeliyetçi', 'çalışmayı seven', 'hızlı öğrenen',
  ],
  en: [
    'team player', 'hard-working', 'hardworking', 'results-oriented', 'result-oriented', 'results-driven', 'detail-oriented', 'self-motivated',
    'go-getter', 'think outside the box', 'synergy', 'dynamic', 'passionate', 'proven track record', 'excellent communication', 'fast learner',
    'highly motivated', 'perfectionist', 'self-starter', 'best of breed', 'go-to person', 'value add',
  ],
};
export function findCliches(t: string, lang: Lang): string[] {
  const low = t.toLocaleLowerCase(lang === 'tr' ? 'tr-TR' : 'en-US');
  return CLICHES[lang].filter((c) => new RegExp(`(^|[^\\p{L}])${esc(c)}`, 'u').test(low));
}
const SOFT = [
  'iletişim', 'takım çalışması', 'ekip çalışması', 'liderlik', 'problem çözme', 'zaman yönetimi', 'analitik düşünme', 'empati', 'uyum', 'esneklik',
  'yaratıcılık', 'sunum', 'ikna', 'motivasyon', 'eleştirel düşünme', 'stres yönetimi', 'organizasyon', 'disiplin', 'girişimcilik', 'sorumluluk',
  'communication', 'teamwork', 'leadership', 'problem solving', 'time management', 'critical thinking', 'adaptability', 'creativity', 'collaboration',
  'interpersonal', 'work ethic', 'attention to detail', 'organization', 'presentation',
].map(fold);
const isSoft = (k: string) => {
  const f = fold(k);
  return SOFT.some((x) => f === x || f.startsWith(x + ' ') || f.endsWith(' ' + x) || (f.includes(x) && f.length <= x.length + 8));
};

export interface ReportInput {
  cv: CV;
  model: RenderModel;
  text: string;
  pages: number;
  plainText: string;
}

export function buildReport({ cv, model, text, pages, plainText }: ReportInput): Report {
  const lang = cv.lang;
  const p = cv.personal;
  const F: Finding[] = [];
  const add = (f: Omit<Finding, 'earned'> & { earned?: number }) => {
    const earned = f.earned ?? (f.level === 'ok' ? f.weight : f.level === 'info' ? f.weight * 0.6 : f.level === 'warn' ? f.weight * 0.3 : 0);
    F.push({ ...f, earned: Math.max(0, Math.min(f.weight, earned)) });
  };
  const exp = cv.sections.experience;
  const isHidden = (k: string) => cv.hidden.includes(k as never);
  const months = totalExperienceMonths(cv);
  const seniority: Seniority = months < 30 ? 'entry' : months < 108 ? 'mid' : 'senior';
  const entryLabel = (e: Entry, key: string) => {
    const t = key === 'experience' ? [s(e.position), s(e.company)] : key === 'education' ? [s(e.school), s(e.field)] : [s(e.name) || s(e.role) || s(e.title), s(e.organization)];
    return t.filter(Boolean).join(' · ') || (lang === 'tr' ? 'Başlıksız' : 'Untitled');
  };

  const T = norm(text);
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const totalWords = words(text);
  if (totalWords < 20) add({ id: 'p-empty', cat: 'parse', level: 'error', weight: 20, critical: true, title: 'PDF’ten neredeyse hiç metin okunamadı', detail: 'ATS bu dosyayı boş görür.' });
  if (text.includes('�')) add({ id: 'p-garbled', cat: 'parse', level: 'error', weight: 10, title: 'PDF’te okunamayan karakter var', detail: 'Bir karakter ATS’ye “�” olarak gidiyor. Başka bir yazı tipi dene.' });
  else add({ id: 'p-garbled', cat: 'parse', level: 'ok', weight: 10, title: 'Tüm karakterler (ç, ğ, ı, ö, ş, ü dahil) doğru okunuyor' });
  if (/[ﬀ-ﬆ]/.test(text)) add({ id: 'p-lig', cat: 'parse', level: 'warn', weight: 4, title: 'Birleşik harf (ligatür) var', detail: '“fi”, “fl” gibi harfler tek karakter okunuyor; arama eşleşmeyebilir.' });
  const spaced = /(?:^|\s)(?:\p{L} ){3,}\p{L}(?:\s|$)/u.exec(text);
  if (spaced) add({ id: 'p-spaced', cat: 'parse', level: 'error', weight: 8, title: 'Aralıklı harfler kelimeyi bölüyor', detail: `“${spaced[0].trim()}” harf harf okunuyor. Tasarım → Başlık harf aralığını azalt.` });

  const name = [p.firstName, p.lastName].map(s).filter(Boolean).join(' ');
  if (name) {
    const top = norm(lines.slice(0, 3).join(' '));
    if (top.includes(norm(name))) add({ id: 'p-name', cat: 'parse', level: 'ok', weight: 10, title: 'Ad soyad en üstte okunuyor', detail: name });
    else if (T.includes(norm(name))) add({ id: 'p-name', cat: 'parse', level: 'warn', weight: 10, title: 'Ad soyad okunuyor ama en üstte değil', detail: 'ATS’ler adı genelde ilk satırlardan alır.' });
    else add({ id: 'p-name', cat: 'parse', level: 'error', weight: 10, critical: true, title: 'Ad soyad PDF metninde bulunamadı', target: { section: 'header' } });
  }
  const emailRe = /[\w.+-]+@[\w-]+(\.[\w-]+)+/;
  if (s(p.email)) {
    const found = emailRe.exec(text)?.[0]?.toLowerCase();
    if (found === p.email.trim().toLowerCase()) add({ id: 'p-email', cat: 'parse', level: 'ok', weight: 10, title: 'E-posta adresi ayrıştırılabiliyor', detail: found });
    else add({ id: 'p-email', cat: 'parse', level: 'error', weight: 10, critical: true, title: 'E-posta adresi ATS tarafından ayrıştırılamıyor', detail: found ? `ATS “${found}” okuyor.` : 'Adres metinde yok.', target: { section: 'header' } });
  }
  const phoneDigits = p.phone.replace(/\D/g, '');
  if (phoneDigits.length >= 7) {
    const ok = text.replace(/\D/g, '').includes(phoneDigits.slice(-10));
    add({ id: 'p-phone', cat: 'parse', level: ok ? 'ok' : 'error', weight: 6, title: ok ? 'Telefon numarası okunuyor' : 'Telefon numarası metinde bulunamadı', detail: ok ? p.phone : undefined, target: ok ? undefined : { section: 'header' } });
  }
  const linkItems = cv.links.map((l) => ({ l, url: resolveLink(l.type, l.value) })).filter((x) => x.url);
  if (linkItems.length) {
    const missing = linkItems.filter((x) => !T.includes(norm(displayLink(x.url))));
    if (!missing.length) add({ id: 'p-links', cat: 'parse', level: 'ok', weight: 5, title: `${linkItems.length} bağlantının adresi metin olarak okunuyor` });
    else
      add({
        id: 'p-links',
        cat: 'parse',
        level: 'warn',
        weight: 5,
        earned: 5 * (1 - missing.length / linkItems.length),
        title: `${missing.length} bağlantının adresi metinde yazmıyor`,
        detail: 'Tıklanabilir ama ATS adresi göremez. Tasarım → İkonlar ve bağlantılar → “Adres” görünümünü seç.',
        items: missing.map((x) => ({ text: displayLink(x.url) })),
      });
  }
  const lineSet = new Set(lines.map(norm));
  if (model.sections.length) {
    const notLine = model.sections.filter((sec) => !lineSet.has(norm(sec.title)));
    add({
      id: 'p-heads',
      cat: 'parse',
      level: notLine.length ? 'warn' : 'ok',
      weight: 7,
      earned: 7 * (1 - notLine.length / model.sections.length),
      title: notLine.length ? `${notLine.length} bölüm başlığı ayrı satır olarak okunmuyor` : `${model.sections.length} bölüm başlığının hepsi ayrı satırda okunuyor`,
      items: notLine.map((h) => ({ text: h.title })),
    });
    const nonStd = model.sections.filter((sec) => !sec.key.startsWith('custom:') && !isStandardTitle(sec.title));
    add({
      id: 'p-std',
      cat: 'parse',
      level: nonStd.length ? 'warn' : 'ok',
      weight: 6,
      earned: 6 * (1 - nonStd.length / model.sections.length),
      title: nonStd.length ? `${nonStd.length} bölümün başlığı standart değil` : 'Bölüm başlıkları ATS’nin tanıdığı standart adlar',
      detail: nonStd.length ? 'ATS bölümleri adından tanır. “Kariyer Yolculuğum” yerine “İş Deneyimi” gibi bilinen bir ad kullan.' : undefined,
      items: nonStd.map((h) => ({ text: h.title, note: SECTION_MAP[h.key as keyof typeof SECTION_MAP] ? `Önerilen: ${SECTION_MAP[h.key as keyof typeof SECTION_MAP].title[lang]}` : undefined, target: { section: h.key } })),
    });
  }
  if (!isHidden('experience') && exp.length) {
    let cursor = 0;
    let disorder = 0;
    let checked = 0;
    for (const e of exp) {
      const keys = [s(e.position) || s(e.company), ...bulletsOf(e).slice(0, 2).map((b) => b.slice(0, 28))].filter(Boolean).map(norm);
      for (const k of keys) {
        checked++;
        const at = T.indexOf(k, cursor);
        if (at >= 0) cursor = at + k.length;
        else if (T.includes(k)) disorder++;
      }
    }
    if (checked)
      add({
        id: 'p-order',
        cat: 'parse',
        level: disorder ? 'error' : 'ok',
        weight: 10,
        earned: 10 * (1 - Math.min(1, disorder / Math.max(3, checked / 2))),
        title: disorder ? 'Deneyimler ATS’de karışık sırayla okunuyor' : 'Deneyim ve maddeler doğru sırayla okunuyor',
        detail: disorder ? 'Metin akışı sayfadaki sırayla aynı değil; ATS maddeleri yanlış işe bağlayabilir.' : undefined,
      });
    const expItems = model.sections.find((x) => x.key === 'experience')?.items ?? [];
    const dates = expItems.flatMap((it) => (it.roles.length ? it.roles.map((r) => r.date) : [it.date])).filter(Boolean);
    const found = dates.filter((d) => T.includes(norm(d)));
    if (dates.length)
      add({
        id: 'p-dates',
        cat: 'parse',
        level: found.length === dates.length ? 'ok' : 'warn',
        weight: 6,
        earned: (6 * found.length) / dates.length,
        title: found.length === dates.length ? `Deneyim tarihlerinin hepsi okunuyor (${dates.length})` : `${dates.length - found.length} deneyim tarihi okunamadı`,
        detail: found.length === dates.length ? 'ATS toplam deneyim süreni bu tarihlerden hesaplar.' : undefined,
      });
  }
  const skillsList = cv.sections.skills.flatMap((k) => (Array.isArray(k.items) ? (k.items as string[]) : [])).map(s).filter(Boolean);
  if (skillsList.length && !isHidden('skills')) {
    const broken = skillsList.filter((k) => !T.includes(norm(k)));
    add({
      id: 'p-skills',
      cat: 'parse',
      level: broken.length ? 'warn' : 'ok',
      weight: 6,
      earned: 6 * (1 - broken.length / skillsList.length),
      title: broken.length ? `${broken.length} yetenek bölünmüş okunuyor` : `${skillsList.length} yeteneğin hepsi bölünmeden okunuyor`,
      items: broken.slice(0, 10).map((t) => ({ text: t })),
    });
  }

  const H: Target = { section: 'header' };
  if (!name || !s(p.firstName) || !s(p.lastName)) add({ id: 'c-name', cat: 'complete', level: 'error', weight: 8, critical: true, title: 'Ad ve soyad eksik', target: H });
  if (!s(p.email)) add({ id: 'c-email', cat: 'complete', level: 'error', weight: 8, critical: true, title: 'E-posta adresi yok', detail: 'İşverenin sana ulaşacağı ilk yol.', target: H });
  else if (!isValidEmail(p.email)) add({ id: 'c-email', cat: 'complete', level: 'error', weight: 8, title: 'E-posta adresi hatalı görünüyor', target: H });
  else if (/(kral|prens|tatli|tatlı|asik|aşık|sevgi|deli|cool|sexy|baby|bebek|kanka|reis|19(03|05|07)|1453|xx|007|666)/i.test(p.email.split('@')[0]))
    add({ id: 'c-email', cat: 'complete', level: 'warn', weight: 8, title: 'E-posta adresi profesyonel görünmüyor', detail: 'ad.soyad@… biçiminde bir adres güven verir.', target: H });
  else add({ id: 'c-email', cat: 'complete', level: 'ok', weight: 8, title: 'E-posta adresi geçerli ve profesyonel' });
  add(s(p.phone) ? { id: 'c-phone', cat: 'complete', level: 'ok', weight: 6, title: 'Telefon var' } : { id: 'c-phone', cat: 'complete', level: 'warn', weight: 6, title: 'Telefon numarası yok', target: H });
  add(s(p.location) ? { id: 'c-loc', cat: 'complete', level: 'ok', weight: 4, title: 'Konum var' } : { id: 'c-loc', cat: 'complete', level: 'warn', weight: 4, title: 'Şehir yazılmamış', detail: 'Birçok ATS adayları konuma göre filtreler.', target: H });
  add(s(p.title) ? { id: 'c-title', cat: 'complete', level: 'ok', weight: 7, title: 'Unvan / hedef pozisyon var' } : { id: 'c-title', cat: 'complete', level: 'warn', weight: 7, title: 'Unvan boş', detail: 'ATS unvanı ilandaki pozisyonla eşleştirir; adının altına hedef pozisyonunu yaz.', target: H });
  add(
    cv.links.some((l) => l.type === 'linkedin' && s(l.value))
      ? { id: 'c-li', cat: 'complete', level: 'ok', weight: 3, title: 'LinkedIn bağlantısı var' }
      : { id: 'c-li', cat: 'complete', level: 'info', weight: 3, earned: 1, title: 'LinkedIn bağlantısı yok', detail: 'İşe alımcıların çoğu profiline bakar.', target: H },
  );
  const hasSummary = !!s(cv.summary) && !isHidden('summary');
  add(hasSummary ? { id: 'c-sum', cat: 'complete', level: 'ok', weight: 6, title: 'Özet var' } : { id: 'c-sum', cat: 'complete', level: 'warn', weight: 6, title: 'Özet yok', detail: '2-4 cümlelik özet, okuyanın ilk 6 saniyesini kazanır ve anahtar kelime taşır.', target: { section: 'summary' } });
  const hasExp = exp.length > 0 && !isHidden('experience');
  const hasEdu = cv.sections.education.length > 0 && !isHidden('education');
  if (!hasExp && !hasEdu) add({ id: 'c-exp', cat: 'complete', level: 'error', weight: 12, title: 'Ne deneyim ne eğitim var', target: { section: 'experience' } });
  else if (!hasExp)
    add({ id: 'c-exp', cat: 'complete', level: 'info', weight: 12, earned: 8, title: 'İş deneyimi yok', detail: 'Staj, gönüllülük, serbest çalışma veya projeler bu boşluğu doldurur.', target: { section: 'experience' } });
  else add({ id: 'c-exp', cat: 'complete', level: 'ok', weight: 12, title: `${exp.length} deneyim girilmiş` });
  add(hasEdu ? { id: 'c-edu', cat: 'complete', level: 'ok', weight: 6, title: 'Eğitim bilgisi var' } : { id: 'c-edu', cat: 'complete', level: 'warn', weight: 6, title: 'Eğitim bilgisi yok', target: { section: 'education' } });
  add(
    skillsList.length && !isHidden('skills')
      ? { id: 'c-skills', cat: 'complete', level: 'ok', weight: 7, title: 'Yetenekler bölümü var' }
      : { id: 'c-skills', cat: 'complete', level: 'error', weight: 7, title: 'Yetenek girilmemiş', detail: 'ATS’ler anahtar kelimeleri en çok burada arar.', target: { section: 'skills' } },
  );
  if (!cv.sections.languages.length) add({ id: 'c-lang', cat: 'complete', level: 'info', weight: 2, earned: 1, title: 'Yabancı dil bilgisi yok', target: { section: 'languages' } });

  if (hasExp) {
    const issues: FindingItem[] = [];
    for (const e of exp) {
      const miss: string[] = [];
      if (!s(e.position)) miss.push('pozisyon');
      if (!s(e.company)) miss.push('şirket');
      const d = e.dates as DateRange | undefined;
      if (!d || !ym(d.start)) miss.push('başlangıç tarihi');
      else if (!d.current && !ym(d.end)) miss.push('bitiş tarihi ya da “halen”');
      if (!bulletsOf(e).length && !s(e.description)) miss.push('yaptıkların');
      if (miss.length) issues.push({ text: entryLabel(e, 'experience'), note: `Eksik: ${miss.join(', ')}`, target: { section: 'experience', entryId: e.id } });
    }
    add({
      id: 'c-exp-fields',
      cat: 'complete',
      level: issues.length ? 'warn' : 'ok',
      weight: 10,
      earned: 10 * (1 - issues.length / exp.length),
      title: issues.length ? `${issues.length} deneyimde eksik alan var` : 'Her deneyimde pozisyon, şirket, tarih ve açıklama var',
      detail: issues.length ? 'Tarihi olmayan deneyimi ATS toplam süreye katmaz; açıklaması olmayan işin değeri anlaşılmaz.' : undefined,
      items: issues,
    });
  }
  if (hasEdu) {
    const issues: FindingItem[] = [];
    for (const e of cv.sections.education) {
      const miss: string[] = [];
      if (!s(e.school)) miss.push('okul');
      if (!s(e.degree) && !s(e.field)) miss.push('derece veya bölüm');
      const d = e.dates as DateRange | undefined;
      if (!d || (!ym(d.end) && !d.current && !ym(d.start))) miss.push('tarih');
      if (miss.length) issues.push({ text: entryLabel(e, 'education'), note: `Eksik: ${miss.join(', ')}`, target: { section: 'education', entryId: e.id } });
    }
    if (issues.length) add({ id: 'c-edu-fields', cat: 'complete', level: 'warn', weight: 5, earned: 5 * (1 - issues.length / cv.sections.education.length), title: `${issues.length} eğitimde eksik alan var`, items: issues });
    else add({ id: 'c-edu-fields', cat: 'complete', level: 'ok', weight: 5, title: 'Eğitimlerde okul, bölüm ve tarih var' });
  }
  {
    const bad: FindingItem[] = [];
    const now = nowYm();
    for (const key of ['experience', 'education', 'projects', 'volunteer'] as const)
      for (const e of cv.sections[key]) {
        const d = e.dates as DateRange | undefined;
        if (!d) continue;
        const a = ym(d.start);
        const b = ym(d.end);
        if (a && b && !d.current && b < a) bad.push({ text: entryLabel(e, key), note: 'Bitiş tarihi başlangıçtan önce', target: { section: key, entryId: e.id } });
        else if (a && a > now + 1 && key === 'experience') bad.push({ text: entryLabel(e, key), note: 'Başlangıç tarihi gelecekte', target: { section: key, entryId: e.id } });
      }
    if (bad.length) add({ id: 'c-dates', cat: 'complete', level: 'error', weight: 6, title: `${bad.length} tarih hatalı`, items: bad });
  }

  const bulletScores: BulletScore[] = [];
  for (const key of ['experience', 'projects', 'volunteer'] as const) {
    if (isHidden(key)) continue;
    for (const e of cv.sections[key])
      bulletsOf(e).forEach((b, i) => bulletScores.push({ ...scoreBullet(b, lang), where: `${entryLabel(e, key)} · ${i + 1}. madde`, target: { section: key, entryId: e.id } }));
  }
  const nB = bulletScores.length;
  const avg = nB ? bulletScores.reduce((n, b) => n + b.score, 0) / nB : 0;
  const metricRatio = nB ? bulletScores.filter((b) => b.metric).length / nB : 0;
  if (!nB) {
    if (hasExp) add({ id: 'i-none', cat: 'impact', level: 'error', weight: 40, title: 'Deneyimlerinde hiç madde yok', detail: 'Her işin altına yaptığın 3-5 somut şeyi madde olarak yaz. Etki puanı maddelerden hesaplanır.', target: { section: 'experience', entryId: exp[0]?.id } });
  } else {
    const weakest = [...bulletScores].sort((a, b) => a.score - b.score).filter((b) => b.score < 60);
    add({
      id: 'i-avg',
      cat: 'impact',
      level: avg >= 75 ? 'ok' : avg >= 55 ? 'warn' : 'error',
      weight: 22,
      earned: (22 * Math.min(100, avg + 10)) / 100,
      title: `Madde kalitesi ortalaması ${Math.round(avg)}/100`,
      detail: avg >= 75 ? 'Maddelerin güçlü: eylem, ölçü ve sonuç içeriyor.' : `${weakest.length} madde 60’ın altında. “Maddeler” sekmesinde hepsini puanıyla görebilirsin.`,
      items: weakest.slice(0, 5).map((b) => ({ text: b.text, where: b.where, note: b.tips[0], target: b.target })),
    });
    const target = 0.5;
    const noMetric = bulletScores.filter((b) => !b.metric);
    add({
      id: 'i-metric',
      cat: 'impact',
      level: metricRatio >= target ? 'ok' : metricRatio >= 0.25 ? 'warn' : 'error',
      weight: 14,
      earned: 14 * Math.min(1, metricRatio / target),
      title: `Maddelerin ${pct(metricRatio)}’ünde ölçülebilir sonuç var`,
      detail: metricRatio >= target ? 'Sayılar etkini kanıtlıyor.' : 'Hedef en az yarısı. Kaç kişi, yüzde kaç, ne kadar sürede, ne kadar tutar? Kesin bilmiyorsan yaklaşık değer (“~20”) de işe yarar.',
      items: metricRatio >= target ? undefined : noMetric.slice(0, 5).map((b) => ({ text: b.text, where: b.where, target: b.target })),
    });
    const strong = bulletScores.filter((b) => b.verb === 'strong' || b.verb === 'active').length / nB;
    const weak = bulletScores.filter((b) => b.verb === 'weak' || b.verb === 'passive');
    add({
      id: 'i-verbs',
      cat: 'impact',
      level: weak.length ? 'warn' : strong >= 0.6 ? 'ok' : 'info',
      weight: 10,
      earned: 10 * Math.max(0, Math.min(1, strong / 0.7) - weak.length / nB),
      title: weak.length ? `${weak.length} maddede pasif / zayıf anlatım var` : `Maddelerin ${pct(strong)}’i güçlü bir eylemle anlatılmış`,
      detail: weak.length ? (lang === 'tr' ? '“Sorumluydum, görev aldım, yardımcı oldum, yapıldı” yerine: yönettim, kurdum, azalttım, hızlandırdım.' : 'Replace “responsible for, helped” with led, built, reduced.') : undefined,
      items: weak.slice(0, 6).map((b) => ({ text: b.text, where: b.where, target: b.target })),
    });
    const verbKey = (t: string) => {
      const ws = plain(t).replace(/[.!;:,]+$/, '').split(/\s+/);
      const w = fold(lang === 'tr' ? ws[ws.length - 1] : ws[0]);
      return lang === 'tr' ? w.replace(/[dt][iu]m$|[dt][iu]k$/, '') : w;
    };
    const counts = new Map<string, { n: number; sample: string }>();
    for (const b of bulletScores) {
      if (b.verb !== 'strong' && b.verb !== 'active') continue;
      const k = verbKey(b.text);
      if (k.length < 2) continue;
      const c = counts.get(k) ?? { n: 0, sample: plain(b.text).replace(/[.!;:,]+$/, '').split(/\s+/)[lang === 'tr' ? plain(b.text).split(/\s+/).length - 1 : 0] };
      c.n++;
      counts.set(k, c);
    }
    const repeated = [...counts.values()].filter((c) => c.n >= 3);
    if (repeated.length)
      add({
        id: 'i-repeat',
        cat: 'impact',
        level: 'info',
        weight: 4,
        earned: 2,
        title: `Aynı fiil tekrar ediyor: ${repeated.map((r) => `“${r.sample}” (${r.n})`).join(', ')}`,
        detail: lang === 'tr' ? 'Çeşitlendir: geliştirdim → kurdum, tasarladım, hayata geçirdim; sağladım → kazandırdım, mümkün kıldım.' : 'Vary your verbs.',
      });
    const perRole: FindingItem[] = [];
    exp.forEach((e, i) => {
      const n = bulletsOf(e).length;
      const recent = i === 0 || !!(e.dates as DateRange | undefined)?.current;
      if (recent && n < 3 && !s(e.description)) perRole.push({ text: entryLabel(e, 'experience'), note: `${n} madde; güncel işlerde 3-6 madde önerilir`, target: { section: 'experience', entryId: e.id } });
      else if (n > 8) perRole.push({ text: entryLabel(e, 'experience'), note: `${n} madde; en etkili 6’sını bırak`, target: { section: 'experience', entryId: e.id } });
    });
    if (hasExp)
      add({
        id: 'i-perrole',
        cat: 'impact',
        level: perRole.length ? 'warn' : 'ok',
        weight: 6,
        earned: 6 * (1 - perRole.length / Math.max(1, exp.length)),
        title: perRole.length ? `${perRole.length} deneyimde madde sayısı dengesiz` : 'Her deneyimde dengeli sayıda madde var',
        items: perRole,
      });
  }
  if (hasSummary) {
    const sum = plain(cv.summary);
    const w = words(sum);
    const issues: string[] = [];
    let pts = 10;
    if (w < 20) {
      issues.push(`Çok kısa (${w} kelime); 30-80 kelime ideal.`);
      pts -= 3;
    } else if (w > 110) {
      issues.push(`Uzun (${w} kelime); 30-80 kelime ideal, okuyan ilk satırlarda karar verir.`);
      pts -= 3;
    }
    const titleWords = fold(p.title || '').split(/\s+/).filter((x) => x.length > 3);
    if (titleWords.length && !titleWords.some((tw) => fold(sum).includes(tw))) {
      issues.push('Unvanın özette geçmiyor; ilk cümlede kim olduğunu söyle (ör. “7 yıllık Bilgi İşlem Uzmanı”).');
      pts -= 2;
    }
    if (!hasMetric(sum) && months >= 12) {
      issues.push('Deneyim süresi ya da öne çıkan bir sayı yok.');
      pts -= 2;
    }
    if ((lang === 'tr' && /\b(ben|benim)\b/i.test(sum)) || (lang === 'en' && /\b(I|my|me)\b/.test(sum))) {
      issues.push(lang === 'tr' ? '“Ben” ile başlayan cümleler yerine doğrudan anlat.' : 'Avoid first person.');
      pts -= 1;
    }
    add({
      id: 'i-summary',
      cat: 'impact',
      level: issues.length ? (pts <= 5 ? 'warn' : 'info') : 'ok',
      weight: 10,
      earned: Math.max(0, pts),
      title: issues.length ? 'Özet güçlendirilebilir' : 'Özet net: unvan, deneyim ve odak var',
      detail: issues.join(' '),
      target: issues.length ? { section: 'summary' } : undefined,
    });
  }
  {
    const pool = [plain(cv.summary), ...bulletScores.map((b) => b.text)].join(' \n ');
    const found = [...new Set(findCliches(pool, lang))];
    add({
      id: 'i-cliche',
      cat: 'impact',
      level: found.length >= 2 ? 'warn' : found.length ? 'info' : 'ok',
      weight: 6,
      earned: 6 - Math.min(6, found.length * 2),
      title: found.length ? `${found.length} klişe ifade: ${found.map((f) => `“${f}”`).join(', ')}` : 'Klişe ifade yok',
      detail: found.length ? 'Okuyan bunları her CV’de görür ve atlar. Sıfatı bir örnekle kanıtla: “çalışkan” yerine yaptığın işin sonucunu yaz.' : undefined,
      target: found.length ? { section: 'summary' } : undefined,
    });
  }

  const cvFold = fold(plainText);
  const uniqSkills = [...new Map(skillsList.map((k) => [fold(k), k])).values()];
  if (skillsList.length) {
    const n = uniqSkills.length;
    add({
      id: 'k-count',
      cat: 'keywords',
      level: n >= 8 && n <= 35 ? 'ok' : n < 8 ? 'warn' : 'info',
      weight: 8,
      earned: n >= 8 && n <= 35 ? 8 : n < 8 ? 8 * (n / 8) : 5,
      title: n < 8 ? `Yalnızca ${n} yetenek var` : n > 35 ? `${n} yetenek; liste çok kalabalık` : `${n} yetenek; yeterli kapsam`,
      detail: n < 8 ? 'ATS eşleşmesi için 10-25 arası somut yetenek (araç, teknoloji, yöntem) önerilir.' : n > 35 ? 'Gerçekten kullandıklarını bırak; uzun listeler güveni azaltır.' : undefined,
      target: n >= 8 && n <= 35 ? undefined : { section: 'skills' },
    });
    const dupes = skillsList.length - uniqSkills.length;
    if (dupes) add({ id: 'k-dupe', cat: 'keywords', level: 'info', weight: 2, earned: 1, title: `${dupes} yetenek birden fazla kez yazılmış`, target: { section: 'skills' } });
    const soft = uniqSkills.filter(isSoft);
    if (soft.length / uniqSkills.length > 0.4)
      add({
        id: 'k-soft',
        cat: 'keywords',
        level: 'warn',
        weight: 6,
        earned: 2,
        title: `Yeteneklerin ${pct(soft.length / uniqSkills.length)}’i kişisel beceri`,
        detail: 'ATS’ler araç, teknoloji ve yöntem adlarını arar. “İletişim, liderlik” gibi becerileri maddelerinde örnekle göster; listeye somut yetkinlikler koy.',
        items: soft.map((t) => ({ text: t })),
        target: { section: 'skills' },
      });
    const evidenceText = fold(
      [cv.summary, ...[...exp, ...cv.sections.projects, ...cv.sections.volunteer].flatMap((e) => [...bulletsOf(e), s(e.description), ...(Array.isArray(e.tags) ? (e.tags as string[]) : [])])].join(' \n '),
    );
    const hard = uniqSkills.filter((k) => !isSoft(k));
    if (hard.length >= 3 && hasExp) {
      const backed = hard.filter((k) => hasTerm(evidenceText, k));
      const r = backed.length / hard.length;
      add({
        id: 'k-evidence',
        cat: 'keywords',
        level: r >= 0.4 ? 'ok' : r >= 0.2 ? 'info' : 'warn',
        weight: 8,
        earned: 8 * Math.min(1, r / 0.4),
        title: `Yeteneklerinin ${pct(r)}’i deneyimlerinde de geçiyor`,
        detail:
          r >= 0.4
            ? 'Yeteneklerin bağlam içinde kanıtlanıyor; modern ATS’ler bunu daha değerli sayar.'
            : 'Listede olup hiçbir işinde geçmeyen yetenek “iddia” olarak kalır. Önemli olanları ilgili madde ya da “Kullanılan teknolojiler” alanında da an.',
        items: r >= 0.4 ? undefined : hard.filter((k) => !backed.includes(k)).slice(0, 10).map((t) => ({ text: t })),
      });
    }
  }
  const role = detectRole(p.title, s(exp[0]?.position), s(exp[1]?.position));
  if (role) {
    const kws = lang === 'en' ? role.keywords.map((k) => KW_EN[k] ?? k) : role.keywords;
    const have = kws.filter((k) => hasTerm(cvFold, k));
    const miss = kws.filter((k) => !have.includes(k));
    const r = have.length / kws.length;
    add({
      id: 'k-role',
      cat: 'keywords',
      level: r >= 0.5 ? 'ok' : r >= 0.3 ? 'info' : 'warn',
      weight: 12,
      earned: 12 * Math.min(1, r / 0.5),
      title: `${role.name} rolünde sık aranan terimlerin ${have.length}/${kws.length} tanesi CV’nde`,
      detail: miss.length
        ? 'Bunlar bu rolün ilanlarında sık geçer. Gerçekten bildiklerini ekle; bilmediğini yazmak mülakatta aleyhine olur. Belirli bir ilan için “İlana uygunluk” sekmesi daha kesin sonuç verir.'
        : 'Bu rol için sık aranan terimlerin hepsi var.',
      items: miss.map((k) => ({ text: k, keyword: k })),
    });
  } else if (s(p.title)) {
    add({ id: 'k-role', cat: 'keywords', level: 'info', weight: 0, title: 'Unvanına göre rol tanınmadı', detail: 'Role özgü öneri için “İlana uygunluk” sekmesine başvurduğun ilanı yapıştır.' });
  }
  if (s(p.title) && hasExp) {
    const tw = fold(p.title).split(/\s+/).filter((x) => x.length > 3);
    const inPos = exp.some((e) => tw.some((w) => fold(s(e.position)).includes(w)));
    add({
      id: 'k-title',
      cat: 'keywords',
      level: inPos ? 'ok' : 'info',
      weight: 4,
      earned: inPos ? 4 : 2,
      title: inPos ? 'Unvanın deneyimlerindeki pozisyonlarla tutarlı' : 'Unvanın hiçbir pozisyonunda geçmiyor',
      detail: inPos ? undefined : 'Kariyer değiştiriyorsan özetinde bunu bir cümleyle açıkla; ATS unvan ile geçmiş pozisyonları karşılaştırır.',
    });
  }
  if (cv.jobPosting.trim().length > 40) {
    const m = matchJob(cv.jobPosting, plainText, cv);
    const miss = m.keywords.filter((k) => !k.found);
    add({
      id: 'k-job',
      cat: 'keywords',
      level: m.score >= 75 ? 'ok' : m.score >= 50 ? 'warn' : 'error',
      weight: 20,
      earned: (20 * Math.min(100, m.score + 10)) / 100,
      title: `Yapıştırdığın ilanla %${m.score} eşleşme`,
      detail: miss.length ? 'İlanda geçip CV’nde olmayanlar aşağıda. Ayrıntı için “İlana uygunluk” sekmesi.' : 'İlandaki anahtar kelimelerin hepsi CV’nde geçiyor.',
      items: miss.slice(0, 12).map((k) => ({ text: k.term, keyword: k.kind === 'title' ? undefined : k.term })),
    });
  }

  const pageIdeal = seniority === 'senior' ? [1, 2] : seniority === 'mid' ? [1, 2] : [1, 1];
  const senLabel = seniority === 'senior' ? '9+ yıl deneyim' : seniority === 'mid' ? '2,5-9 yıl deneyim' : 'yeni mezun / az deneyim';
  if (pages)
    add({
      id: 'l-pages',
      cat: 'layout',
      level: pages <= pageIdeal[1] ? 'ok' : pages === pageIdeal[1] + 1 ? 'warn' : 'error',
      weight: 10,
      earned: pages <= pageIdeal[1] ? 10 : pages === pageIdeal[1] + 1 ? 5 : 1,
      title: `${pages} sayfa (${senLabel} için ideal: ${pageIdeal[1] === 1 ? '1 sayfa' : '1-2 sayfa'})`,
      detail: pages > pageIdeal[1] ? 'Önizlemedeki “Tek sayfaya sığdır” düğmesini dene ya da 10 yıldan eski işleri kısalt.' : undefined,
    });
  const wr = seniority === 'entry' ? [180, 600] : seniority === 'mid' ? [250, 850] : [350, 1100];
  add({
    id: 'l-words',
    cat: 'layout',
    level: totalWords >= wr[0] && totalWords <= wr[1] ? 'ok' : totalWords < wr[0] ? 'warn' : 'info',
    weight: 7,
    earned: totalWords >= wr[0] && totalWords <= wr[1] ? 7 : totalWords < wr[0] ? 7 * (totalWords / wr[0]) : 4,
    title: `${totalWords} kelime (ideal aralık ${wr[0]}-${wr[1]})`,
    detail: totalWords < wr[0] ? 'İçerik az; ATS’nin eşleştireceği kelime sayısı düşük kalır.' : totalWords > wr[1] ? 'Uzun; okuyan ortalama 6-8 saniye ayırır. Eski ve ilgisiz kısımları kısalt.' : undefined,
  });
  if (exp.length > 1) {
    const starts = exp.map((e) => {
      const d = e.dates as DateRange | undefined;
      return { e, a: d ? ym(d.start) : null, cur: !!d?.current };
    });
    const wrong: FindingItem[] = [];
    for (let i = 1; i < starts.length; i++) {
      const prev = starts[i - 1];
      const cur = starts[i];
      if (prev.a !== null && cur.a !== null && (cur.a > prev.a || (cur.cur && !prev.cur)))
        wrong.push({ text: entryLabel(cur.e, 'experience'), note: `“${entryLabel(prev.e, 'experience')}” girdisinden daha yeni`, target: { section: 'experience', entryId: cur.e.id } });
    }
    add({
      id: 'l-chrono',
      cat: 'layout',
      level: wrong.length ? 'warn' : 'ok',
      weight: 7,
      earned: wrong.length ? 2 : 7,
      title: wrong.length ? 'Deneyimler yeniden eskiye sıralı değil' : 'Deneyimler yeniden eskiye sıralı',
      detail: wrong.length ? 'ATS ve işe alımcılar en üstteki işi “güncel iş” sayar. Sürükleyerek sırala.' : undefined,
      items: wrong,
    });
  }
  {
    const spans = exp
      .map((e) => e.dates as DateRange | undefined)
      .filter((d): d is DateRange => !!d && !!ym(d.start))
      .map((d) => ({ a: ym(d.start)!, b: d.current ? nowYm() : ym(d.end) ?? ym(d.start)! }))
      .sort((x, y) => x.a - y.a);
    let gaps = 0;
    let maxEnd = spans[0]?.b ?? 0;
    for (let i = 1; i < spans.length; i++) {
      if (spans[i].a - maxEnd > 6) gaps++;
      maxEnd = Math.max(maxEnd, spans[i].b);
    }
    if (gaps) add({ id: 'l-gaps', cat: 'layout', level: 'info', weight: 3, earned: 2, title: `${gaps} yerde 6 aydan uzun boşluk var`, detail: 'Askerlik, eğitim, kurs veya serbest çalışma gibi bir açıklaman varsa CV’de görünsün.' });
  }
  if (nB >= 4) {
    const dots = bulletScores.filter((b) => /[.!]$/.test(b.text)).length;
    const mixedPunct = dots > 0 && dots < nB;
    const act = bulletScores.filter((b) => b.verb === 'strong' || b.verb === 'active').length;
    const nom = bulletScores.filter((b) => b.verb === 'nominal').length;
    const mixedStyle = lang === 'tr' && act / nB >= 0.25 && nom / nB >= 0.25;
    const issues = [mixedPunct && `${dots}/${nB} madde noktayla bitiyor`, mixedStyle && 'kimi madde “…kurdum”, kimi “…kurulması” diye bitiyor'].filter(Boolean) as string[];
    add({
      id: 'l-consistency',
      cat: 'layout',
      level: issues.length ? 'info' : 'ok',
      weight: 4,
      earned: 4 - issues.length * 1.5,
      title: issues.length ? 'Maddelerde üslup tutarsız' : 'Maddelerde noktalama ve üslup tutarlı',
      detail: issues.length ? `${issues.join('; ')}. Hepsinde aynı biçimi kullan.` : undefined,
    });
  }
  const d = cv.design;
  add(
    d.sizes.body >= 9.5
      ? { id: 'l-size', cat: 'layout', level: 'ok', weight: 4, title: `Metin boyutu ${d.sizes.body} pt; rahat okunuyor` }
      : { id: 'l-size', cat: 'layout', level: d.sizes.body < 9 ? 'warn' : 'info', weight: 4, earned: d.sizes.body < 9 ? 1 : 3, title: `Metin boyutu ${d.sizes.body} pt`, detail: '9,5-11 pt arası önerilir; küçük yazı basılıyken zor okunur.' },
  );
  const minMargin = Math.min(d.margins.left, d.margins.right, d.margins.top, d.margins.bottom);
  if (minMargin < 10) add({ id: 'l-margin', cat: 'layout', level: 'warn', weight: 3, earned: 1, title: `Kenar boşluğu ${minMargin} mm`, detail: 'Yazıcılar kenarı kesebilir; en az 10-12 mm bırak.' });
  const cText = contrast(d.colors.text, '#ffffff');
  const cMuted = contrast(d.colors.muted, '#ffffff');
  if (cText < 7 || cMuted < 4.5)
    add({ id: 'l-contrast', cat: 'layout', level: 'warn', weight: 4, earned: 1, title: 'Metin rengi açık; okunurluk düşük', detail: `Kontrast ${cText.toFixed(1)}:1 (gövde), ${cMuted.toFixed(1)}:1 (ikincil). En az 7:1 ve 4,5:1 önerilir.` });
  else add({ id: 'l-contrast', cat: 'layout', level: 'ok', weight: 4, title: 'Renk kontrastı yeterli' });
  if (lang === 'en' && !cv.international && (p.showPhoto || p.birthDate))
    add({ id: 'l-intl', cat: 'layout', level: 'info', weight: 3, earned: 1, title: 'İngilizce CV’de fotoğraf veya doğum tarihi var', detail: 'ABD, İngiltere gibi ülkelerde bunlar istenmez; üstteki “Uluslararası” düğmesi gizler.' });

  const categories: CategoryScore[] = CATEGORIES.map((c) => {
    const fs = F.filter((f) => f.cat === c.id && f.weight > 0);
    const w = fs.reduce((n, f) => n + f.weight, 0);
    const e = fs.reduce((n, f) => n + f.earned, 0);
    return { ...c, score: w ? Math.round((100 * e) / w) : 100 };
  });
  const weakPenalty = categories.reduce((n, c) => n + Math.max(0, 60 - c.score) * 0.25, 0);
  let total = Math.max(0, Math.round(categories.reduce((n, c) => n + c.score * c.weight, 0) - weakPenalty));
  const capped = F.some((f) => f.critical && f.level === 'error');
  if (capped) total = Math.min(total, 49);
  const grade = total >= 90 ? 'A' : total >= 80 ? 'B' : total >= 65 ? 'C' : total >= 50 ? 'D' : 'E';
  const verdict = capped
    ? 'Kritik bir sorun var: ATS seni tanımlayamayabilir'
    : grade === 'A'
      ? 'Çok güçlü; başvurmaya hazır'
      : grade === 'B'
        ? 'İyi; birkaç düzeltmeyle üst seviyeye çıkar'
        : grade === 'C'
          ? 'Ortalama; öne çıkmak için içeriği güçlendir'
          : 'Zayıf; önce aşağıdaki düzeltmeleri yap';
  const catW = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.weight])) as Record<CategoryId, number>;
  const catTotal = Object.fromEntries(CATEGORIES.map((c) => [c.id, F.filter((f) => f.cat === c.id).reduce((n, f) => n + f.weight, 0) || 1])) as Record<CategoryId, number>;
  const impact = (f: Finding) => ((f.weight - f.earned) / catTotal[f.cat]) * catW[f.cat] * 100 + (f.critical && f.level === 'error' ? 100 : 0);
  const fixes = F.filter((f) => f.level !== 'ok' && f.weight - f.earned > 0.4)
    .sort((a, b) => impact(b) - impact(a))
    .slice(0, 5);

  return {
    score: total,
    grade,
    verdict,
    categories,
    findings: F,
    fixes,
    bullets: bulletScores,
    role,
    capped,
    stats: { words: totalWords, pages, bullets: nB, months, seniority, metricRatio, avgBullet: Math.round(avg) },
  };
}

export function potentialGain(r: Report, f: Finding): number {
  const c = CATEGORIES.find((x) => x.id === f.cat)!;
  const total = r.findings.filter((x) => x.cat === f.cat).reduce((n, x) => n + x.weight, 0) || 1;
  return Math.max(1, Math.round(((f.weight - f.earned) / total) * c.weight * 100));
}
