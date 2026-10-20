/**
 * LinkedIn "PDF olarak kaydet" çıktısını ayrıştırır.
 * Düzen: solda dar sütun (İletişim, Öne çıkan yetenekler, Diller, Sertifikalar), sağda ana sütun
 * (Ad, başlık, konum, Özet, Deneyim, Eğitim). Konum ve yazı boyutuna göre çalışır; her iki dili tanır.
 */
import type { CV } from '../model/types';
import { emptyCV, newEntry, uid } from '../model/defaults';
import type { PdfText } from '../ats/pdfText';
import { formatPhone } from '../model/links';

interface Line {
  text: string;
  size: number;
  page: number;
  y: number;
  side: boolean;
}

const fold = (t: string) => t.toLocaleLowerCase('tr-TR').replace(/ı/g, 'i').replace(/\s+/g, ' ').trim();
const H = (...names: string[]) => new Set(names.map(fold));
const SIDE_HEADS = {
  contact: H('Contact', 'İletişim', 'Iletişim'),
  skills: H('Top Skills', 'En Önemli Yetenekler', 'Öne Çıkan Yetenekler', 'Yetenekler', 'Top skills'),
  languages: H('Languages', 'Diller'),
  certs: H('Certifications', 'Sertifikalar', 'Lisanslar ve Sertifikalar', 'Licenses & Certifications'),
  honors: H('Honors-Awards', 'Honors & Awards', 'Onur ve Ödüller', 'Ödüller'),
  pubs: H('Publications', 'Yayınlar'),
  patents: H('Patents', 'Patentler'),
};
const MAIN_HEADS = {
  summary: H('Summary', 'Özet', 'Hakkında', 'About'),
  experience: H('Experience', 'Deneyim'),
  education: H('Education', 'Eğitim'),
};

const MONTHS: Record<string, number> = {};
['ocak', 'şubat', 'mart', 'nisan', 'mayıs', 'haziran', 'temmuz', 'ağustos', 'eylül', 'ekim', 'kasım', 'aralık'].forEach((m, i) => (MONTHS[fold(m)] = i + 1));
['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'].forEach((m, i) => (MONTHS[m] = i + 1));
['jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'sept', 'oct', 'nov', 'dec'].forEach((m) => {
  const full = Object.keys(MONTHS).find((k) => k.startsWith(m));
  if (full) MONTHS[m] = MONTHS[full];
});

const MONTH_RE = '(?:[A-Za-zÇĞİÖŞÜçğıöşü]+\\s+)?\\d{4}';
const PRESENT_RE = '(?:present|halen|günümüz|şu anda|şimdi|devam ediyor|now)';
const DATE_LINE = new RegExp(`^(${MONTH_RE})\\s*[-–]\\s*(${MONTH_RE}|${PRESENT_RE})(?:\\s*\\(.*\\))?$`, 'i');
const DURATION_LINE = /^\(?\d+\s*(yıl|yil|ay|years?|months?|mos?|yrs?)(\s+\d+\s*(ay|months?|mos?))?\)?$/i;
const FOOTER = /^(page|sayfa)\s*\d+\s*(of|\/)\s*\d+$/i;

function ym(t: string): string {
  const m = /([A-Za-zÇĞİÖŞÜçğıöşü]+)?\s*(\d{4})/.exec(t);
  if (!m) return '';
  const mon = m[1] ? MONTHS[fold(m[1])] : 0;
  return mon ? `${m[2]}-${String(mon).padStart(2, '0')}` : m[2];
}

function toLines(pdf: PdfText): Line[] {
  const split = pdf.pageWidth * 0.3;
  const groups = new Map<string, { items: PdfText['items']; side: boolean; page: number; y: number }>();
  for (const it of pdf.items) {
    if (!it.str.trim()) continue;
    const side = it.x < split;
    const key = `${it.page}|${side ? 'S' : 'M'}|${Math.round(it.y / 2)}`;
    const g = groups.get(key) ?? { items: [], side, page: it.page, y: it.y };
    g.items.push(it);
    groups.set(key, g);
  }
  const lines: Line[] = [];
  for (const g of groups.values()) {
    g.items.sort((a, b) => a.x - b.x);
    let text = '';
    let lastEnd = -1;
    for (const it of g.items) {
      if (lastEnd >= 0 && it.x - lastEnd > it.size * 0.15 && !text.endsWith(' ') && !it.str.startsWith(' ')) text += ' ';
      text += it.str;
      lastEnd = it.x + it.width;
    }
    const size = Math.max(...g.items.map((i) => i.size));
    text = text.replace(/\s+/g, ' ').trim();
    if (!text || FOOTER.test(text)) continue;
    lines.push({ text, size, page: g.page, y: g.y, side: g.side });
  }
  // sayfa sırası, sonra yukarıdan aşağı
  return lines.sort((a, b) => a.page - b.page || b.y - a.y);
}

function sectionize(lines: Line[], heads: Record<string, Set<string>>): { pre: Line[]; parts: Record<string, Line[]> } {
  const parts: Record<string, Line[]> = {};
  const pre: Line[] = [];
  let cur: string | null = null;
  for (const l of lines) {
    const key = Object.entries(heads).find(([, set]) => set.has(fold(l.text)))?.[0];
    if (key) {
      cur = key;
      parts[key] ??= [];
      continue;
    }
    if (cur) parts[cur].push(l);
    else pre.push(l);
  }
  return { pre, parts };
}

const modeSize = (ls: Line[]) => {
  const c = new Map<number, number>();
  for (const l of ls) c.set(Math.round(l.size * 2) / 2, (c.get(Math.round(l.size * 2) / 2) ?? 0) + 1);
  // eşitlikte küçük boyut gövde metnidir
  return [...c.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]?.[0] ?? 10;
};

/** URL'ler sütunda birden çok satıra bölünür: "(LinkedIn)" gibi etikete kadar birleştir */
function collectUrls(lines: string[]): { url: string; label: string }[] {
  const out: { url: string; label: string }[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (!/(https?:\/\/|www\.|\.[a-z]{2,}\/|linkedin\.com|github\.com)/i.test(lines[i]) || /@/.test(lines[i])) continue;
    let buf = lines[i];
    let j = i;
    while (!/\([^)]+\)\s*$/.test(buf) && j + 1 < lines.length && !/@|\d{6,}/.test(lines[j + 1]) && j - i < 3) {
      j++;
      buf += lines[j];
    }
    const m = /^(.*?)\s*\(([^)]+)\)\s*$/.exec(buf);
    out.push({ url: (m ? m[1] : buf).replace(/\s+/g, ''), label: m ? m[2] : '' });
    i = j;
  }
  return out;
}

const LANG_LEVEL: [RegExp, string][] = [
  [/native|bilingual|ana dil|anadil|iki dilli/i, 'native'],
  [/full professional|tam profesyonel/i, 'C1'],
  [/professional working|profesyonel çalışma/i, 'B2'],
  [/limited working|sınırlı çalışma/i, 'B1'],
  [/elementary|başlangıç|temel/i, 'A2'],
];

export interface LinkedInResult {
  cv: CV;
  found: string[]; // kullanıcıya özet
}

export function parseLinkedIn(pdf: PdfText): LinkedInResult {
  const lines = toLines(pdf);
  if (!lines.length) throw new Error('PDF’te metin bulunamadı. LinkedIn’den “PDF olarak kaydet” ile indirdiğin dosyayı seç.');
  const side = lines.filter((l) => l.side);
  const main = lines.filter((l) => !l.side);
  const S = sectionize(side, SIDE_HEADS);
  const M = sectionize(main, MAIN_HEADS);
  if (!M.parts.experience && !M.parts.education && !S.parts.contact)
    throw new Error('Bu dosya LinkedIn profil PDF’ine benzemiyor. LinkedIn profilinde “Diğer → PDF olarak kaydet” ile indirilen dosyayı seç.');

  const cv = emptyCV('LinkedIn’den içe aktarılan CV');
  const found: string[] = [];

  // Ad, başlık, konum
  const pre = M.pre;
  if (pre.length) {
    const nameLine = pre.reduce((a, b) => (b.size > a.size ? b : a), pre[0]);
    const parts = nameLine.text.split(' ');
    cv.personal.lastName = parts.length > 1 ? parts.pop()! : '';
    cv.personal.firstName = parts.join(' ');
    const after = pre.slice(pre.indexOf(nameLine) + 1);
    if (after.length >= 2) {
      cv.personal.location = after[after.length - 1].text;
      cv.personal.title = after.slice(0, -1).map((l) => l.text).join(' ');
    } else if (after.length === 1) cv.personal.title = after[0].text;
    found.push('ad ve başlık');
  }

  // İletişim
  const contact = (S.parts.contact ?? []).map((l) => l.text);
  const joined = contact.join(' ');
  const email = /[\w.+-]+@[\w-]+(\.[\w-]+)+/.exec(joined.replace(/\s+@\s+/, '@'));
  if (email) cv.personal.email = email[0];
  const phone = contact.find((l) => (l.match(/\d/g) ?? []).length >= 10 && !/@|linkedin|www\./i.test(l));
  if (phone) cv.personal.phone = formatPhone(phone.replace(/\s*\((mobile|mobil|cep|iş|work|home|ev)\)\s*/i, '').trim());
  for (const u of collectUrls(contact)) {
    const url = u.url.replace(/^https?:\/\//, '');
    const type = /linkedin\.com\/in\//i.test(url) ? 'linkedin' : /github\.com/i.test(url) ? 'github' : /behance/i.test(url) ? 'behance' : 'custom';
    cv.links.push({ id: uid(), type: type === 'custom' && /portfolio|portfolyo/i.test(u.label) ? 'portfolio' : type, value: url, label: type === 'custom' ? u.label : '' });
  }
  if (cv.personal.email || cv.links.length) found.push('iletişim bilgileri');

  // Yetenekler, diller, sertifikalar, ödüller
  const skills = (S.parts.skills ?? []).map((l) => l.text);
  if (skills.length) {
    cv.sections.skills = [newEntry({ name: '', items: skills })];
    found.push(`${skills.length} yetenek`);
  }
  const langs = (S.parts.languages ?? []).map((l) => l.text);
  if (langs.length) {
    cv.sections.languages = langs.map((t) => {
      const m = /^(.*?)\s*\((.*)\)\s*$/.exec(t);
      const name = m ? m[1] : t;
      const lvl = m ? LANG_LEVEL.find(([re]) => re.test(m[2]))?.[1] ?? '' : '';
      return newEntry({ language: name, level: lvl, exam: '', score: '' });
    });
    found.push(`${langs.length} dil`);
  }
  const certs = (S.parts.certs ?? []).map((l) => l.text);
  if (certs.length) {
    cv.sections.certificates = certs.map((t) => newEntry({ name: t, issuer: '', date: '' }));
    found.push(`${certs.length} sertifika`);
  }
  const honors = (S.parts.honors ?? []).map((l) => l.text);
  if (honors.length) cv.sections.awards = honors.map((t) => newEntry({ title: t, issuer: '', date: '' }));

  // Özet: satırları paragraflara birleştir (büyük dikey boşluk = yeni paragraf)
  const sum = M.parts.summary ?? [];
  if (sum.length) {
    let text = '';
    sum.forEach((l, i) => {
      if (i) {
        const prev = sum[i - 1];
        const gap = prev.page === l.page ? prev.y - l.y : 0;
        text += gap > l.size * 1.9 ? '\n\n' : ' ';
      }
      text += l.text;
    });
    cv.summary = text.trim();
    found.push('özet');
  }

  // Deneyim
  const exp = M.parts.experience ?? [];
  if (exp.length) {
    const desc = modeSize(exp);
    const isHead = (l: Line) => l.size > desc + 0.3;
    const dateIdx = exp.map((l, i) => (DATE_LINE.test(l.text) ? i : -1)).filter((i) => i >= 0);
    let company = '';
    let companyLoc = '';
    dateIdx.forEach((di, k) => {
      // başlık satırları: tarih satırının hemen üstündeki büyük yazılar
      let j = di - 1;
      const heads: string[] = [];
      while (j >= 0 && (isHead(exp[j]) || DURATION_LINE.test(exp[j].text)) && !DATE_LINE.test(exp[j].text)) {
        if (!DURATION_LINE.test(exp[j].text)) heads.unshift(exp[j].text);
        j--;
      }
      const title = heads.length ? heads[heads.length - 1] : exp[di - 1]?.text ?? '';
      if (heads.length >= 2) {
        company = heads[0];
        companyLoc = '';
      }
      const m = DATE_LINE.exec(exp[di].text)!;
      const current = new RegExp(PRESENT_RE, 'i').test(m[2]);
      // açıklama: bir sonraki girdinin başlık satırlarına kadar
      const nextStart = (() => {
        if (k + 1 >= dateIdx.length) return exp.length;
        let s = dateIdx[k + 1] - 1;
        while (s > di && (isHead(exp[s]) || DURATION_LINE.test(exp[s].text))) s--;
        return s + 1;
      })();
      const body = exp.slice(di + 1, nextStart).map((l) => l.text);
      let location = '';
      if (body.length && body[0].length < 60 && !/[.:;]$/.test(body[0]) && (/,/.test(body[0]) || /(türkiye|turkey|istanbul|ankara|izmir|remote|uzaktan)/i.test(body[0]))) {
        location = body.shift()!;
        if (!companyLoc) companyLoc = location;
      }
      // madde işaretli satırlar madde, diğerleri açıklama
      const bullets: string[] = [];
      const descLines: string[] = [];
      for (const t of body) {
        if (/^[•·\-–*▪]\s*/.test(t)) bullets.push(t.replace(/^[•·\-–*▪]\s*/, ''));
        else if (bullets.length && !/^[A-ZÇĞİÖŞÜ]/.test(t)) bullets[bullets.length - 1] += ' ' + t;
        else descLines.push(t);
      }
      cv.sections.experience.push(
        newEntry({
          position: title,
          company: company || '',
          location: location.replace(/,?\s*(Türkiye|Turkey)$/i, '').trim(),
          dates: { start: ym(m[1]), end: current ? '' : ym(m[2]), current },
          description: descLines.join(' '),
          bullets,
          tags: [],
        }),
      );
    });
    if (cv.sections.experience.length) found.push(`${cv.sections.experience.length} deneyim`);
  }

  // Eğitim
  const edu = M.parts.education ?? [];
  if (edu.length) {
    const desc = Math.min(...edu.map((l) => Math.round(l.size * 2) / 2));
    let cur: Record<string, unknown> | null = null;
    for (const l of edu) {
      if (l.size > desc + 0.3) {
        if (cur) cv.sections.education.push(newEntry(cur));
        cur = { school: l.text, degree: '', field: '', dates: { start: '', end: '', current: false }, tags: [], description: '' };
      } else if (cur) {
        const years = /\((?:[^)]*?)(\d{4})\s*[-–]\s*(?:[^)]*?)(\d{4})?\)/.exec(l.text);
        const main = l.text.replace(/\s*·?\s*\([^)]*\d{4}[^)]*\)\s*$/, '').trim();
        if (years) cur.dates = { start: ym(l.text.slice(l.text.indexOf('(')).split(/[-–]/)[0]), end: years[2] ? ym(l.text.slice(l.text.indexOf('(')).split(/[-–]/)[1]) : '', current: false };
        if (main && !cur.field) {
          const [deg, ...rest] = main.split(',');
          cur.field = rest.length ? rest.join(',').trim() : '';
          cur.description = rest.length ? '' : deg.trim();
          cur.degreeText = deg.trim();
          const d = fold(deg);
          cur.degree = /lisans üstü|yüksek lisans|master|mba|msc|m\.sc|ma\b/.test(d)
            ? 'master'
            : /doktora|phd|ph\.d/.test(d)
              ? 'phd'
              : /ön ?lisans|associate/.test(d)
                ? 'associate'
                : /lisans|bachelor|bsc|b\.sc|ba\b|be\b/.test(d)
                  ? 'bachelor'
                  : /lise|high school/.test(d)
                    ? 'highschool'
                    : '';
          if (!cur.degree && rest.length) cur.field = main;
        }
      }
    }
    if (cur) cv.sections.education.push(newEntry(cur));
    if (cv.sections.education.length) found.push(`${cv.sections.education.length} eğitim`);
  }

  cv.personal.title ||= cv.sections.experience[0]?.position as string;
  return { cv, found };
}
