import type { CV, DateRange } from '../model/types';
import { isValidEmail } from '../model/links';
import { bulletHints } from './writing';

export type Level = 'ok' | 'warn' | 'error' | 'info';
export interface Check {
  id: string;
  level: Level;
  title: string;
  detail?: string;
  /** düzeltmek için gidilecek bölüm */
  target?: string;
}

const s = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const ym = (v: string) => {
  const m = /^(\d{4})(?:-(\d{2}))?/.exec(v || '');
  return m ? parseInt(m[1], 10) * 12 + (m[2] ? parseInt(m[2], 10) - 1 : 0) : null;
};
const nowYm = () => {
  const d = new Date();
  return d.getFullYear() * 12 + d.getMonth();
};

const UNPRO_EMAIL = /(kral|prens|tatli|tatlı|asik|aşık|sevgi|kızgın|deli|cool|sexy|baby|bebek|kanka|reis|1903|1905|1907|1453|\bxx|_xx|007|666|31\b)/i;

/** Toplam iş deneyimi (ay), çakışan dönemler bir kez sayılır */
export function totalExperienceMonths(cv: CV): number {
  const spans = cv.sections.experience
    .map((e) => e.dates as DateRange | undefined)
    .filter((d): d is DateRange => !!d && !!ym(d.start))
    .map((d) => [ym(d.start)!, d.current ? nowYm() : ym(d.end) ?? ym(d.start)!] as [number, number])
    .filter(([a, b]) => b >= a)
    .sort((a, b) => a[0] - b[0]);
  let total = 0;
  let cur: [number, number] | null = null;
  for (const sp of spans) {
    if (!cur || sp[0] > cur[1]) {
      if (cur) total += cur[1] - cur[0] + 1;
      cur = [...sp];
    } else cur[1] = Math.max(cur[1], sp[1]);
  }
  if (cur) total += cur[1] - cur[0] + 1;
  return total;
}

export function qualityChecks(cv: CV, pages: number): Check[] {
  const p = cv.personal;
  const out: Check[] = [];
  const add = (c: Check) => out.push(c);
  const lang = cv.lang;

  // temel bilgiler
  if (!s(p.firstName) || !s(p.lastName)) add({ id: 'name', level: 'error', title: 'Ad ve soyad eksik', target: 'header' });
  if (!s(p.email)) add({ id: 'email', level: 'error', title: 'E-posta adresi yok', detail: 'İşverenin sana ulaşacağı ilk yol.', target: 'header' });
  else if (!isValidEmail(p.email)) add({ id: 'email', level: 'error', title: 'E-posta adresi hatalı görünüyor', target: 'header' });
  else if (UNPRO_EMAIL.test(p.email.split('@')[0]))
    add({ id: 'email-pro', level: 'warn', title: 'E-posta adresi profesyonel görünmeyebilir', detail: 'ad.soyad@… biçiminde bir adres daha güven verir.', target: 'header' });
  if (!s(p.phone)) add({ id: 'phone', level: 'warn', title: 'Telefon numarası yok', target: 'header' });
  if (!s(p.title)) add({ id: 'title', level: 'warn', title: 'Unvan / hedef pozisyon boş', detail: 'ATS’ler unvanı ilandaki pozisyonla eşleştirir.', target: 'header' });
  if (!s(p.location)) add({ id: 'loc', level: 'info', title: 'Konum yazılmamış', detail: 'Şehir yazmak yerel ilanlarda filtreye takılmanı önler.', target: 'header' });
  if (!cv.links.some((l) => l.type === 'linkedin' && s(l.value)))
    add({ id: 'linkedin', level: 'info', title: 'LinkedIn bağlantısı yok', detail: 'İşverenlerin çoğu LinkedIn profiline bakar.', target: 'header' });

  // özet
  const sum = s(cv.summary);
  if (!sum && !cv.hidden.includes('summary')) add({ id: 'summary', level: 'warn', title: 'Özet yazılmamış', detail: '2-4 cümlelik özet, okuyanın ilk 6 saniyesini kazanır.', target: 'summary' });
  else if (sum.length > 700) add({ id: 'summary-long', level: 'warn', title: 'Özet çok uzun', detail: `${sum.length} karakter; 600’ün altında tut.`, target: 'summary' });

  // deneyim
  const exp = cv.sections.experience;
  if (!exp.length && !cv.sections.education.length) add({ id: 'no-exp', level: 'error', title: 'Ne deneyim ne eğitim girilmiş', target: 'experience' });
  else if (!exp.length) add({ id: 'no-exp', level: 'info', title: 'İş deneyimi yok', detail: 'Staj, gönüllülük veya projeler bu boşluğu doldurabilir.', target: 'experience' });
  const noDates = exp.filter((e) => !ym((e.dates as DateRange | undefined)?.start ?? ''));
  if (noDates.length) add({ id: 'exp-dates', level: 'warn', title: `${noDates.length} deneyimde başlangıç tarihi yok`, detail: 'ATS tarihi olmayan deneyimi süreye saymaz.', target: 'experience' });
  const noBullets = exp.filter((e) => !(Array.isArray(e.bullets) && (e.bullets as string[]).some((b) => b.trim())) && !s(e.description));
  if (noBullets.length) add({ id: 'exp-empty', level: 'warn', title: `${noBullets.length} deneyimin altı boş`, detail: 'Her işin altına yaptığın 2-4 somut şeyi yaz.', target: 'experience' });

  // tarih boşlukları (yeniden eskiye sıralı varsayımı olmadan)
  const spans = exp
    .map((e) => e.dates as DateRange | undefined)
    .filter((d): d is DateRange => !!d && !!ym(d.start))
    .map((d) => ({ a: ym(d.start)!, b: d.current ? nowYm() : ym(d.end) ?? ym(d.start)! }))
    .sort((x, y) => x.a - y.a);
  let gapCount = 0;
  let maxEnd = spans[0]?.b ?? 0;
  for (let i = 1; i < spans.length; i++) {
    if (spans[i].a - maxEnd > 6) gapCount++;
    maxEnd = Math.max(maxEnd, spans[i].b);
  }
  if (gapCount) add({ id: 'gaps', level: 'info', title: `${gapCount} yerde 6 aydan uzun boşluk var`, detail: 'Askerlik, eğitim veya kurs gibi bir açıklaman varsa CV’de görünsün.', target: 'experience' });

  // maddeler
  const bullets = [...exp, ...cv.sections.projects, ...cv.sections.volunteer].flatMap((e) => (Array.isArray(e.bullets) ? (e.bullets as string[]) : [])).filter((b) => b.trim());
  if (bullets.length) {
    const withNum = bullets.filter((b) => /\d/.test(b)).length;
    if (withNum / bullets.length < 0.3)
      add({ id: 'numbers', level: 'warn', title: `Maddelerin yalnızca ${withNum}/${bullets.length} tanesinde sayı var`, detail: '“%35 azalttım”, “250 kullanıcı” gibi ölçüler etkiyi gösterir.', target: 'experience' });
    const weak = bullets.filter((b) => bulletHints(b, lang).some((h) => h.kind === 'weak')).length;
    if (weak) add({ id: 'weak', level: 'warn', title: `${weak} maddede pasif ifade var`, detail: '“Sorumluydum, görev aldım” yerine “yönettim, kurdum, azalttım”.', target: 'experience' });
    const long = bullets.filter((b) => b.length > 220).length;
    if (long) add({ id: 'long', level: 'warn', title: `${long} madde çok uzun`, target: 'experience' });
    const dots = bullets.filter((b) => /[.!]$/.test(b.trim())).length;
    if (dots && dots !== bullets.length) add({ id: 'punct', level: 'info', title: 'Maddelerin bir kısmı noktayla bitiyor, bir kısmı bitmiyor', detail: 'Tutarlı olsun.', target: 'experience' });
  }

  // yetenekler, eğitim
  if (!cv.sections.skills.some((k) => Array.isArray(k.items) && (k.items as string[]).length)) add({ id: 'skills', level: 'warn', title: 'Yetenek girilmemiş', detail: 'ATS en çok bu bölümdeki anahtar kelimelere bakar.', target: 'skills' });
  if (!cv.sections.education.length) add({ id: 'edu', level: 'warn', title: 'Eğitim bilgisi yok', target: 'education' });
  if (!cv.sections.languages.length) add({ id: 'lang', level: 'info', title: 'Yabancı dil bilgisi yok', target: 'languages' });

  // uzunluk, uyumluluk
  if (pages > 2) add({ id: 'pages', level: 'warn', title: `CV ${pages} sayfa`, detail: 'Çoğu ilan için 1-2 sayfa idealdir. “Tek sayfaya sığdır”ı dene ya da eski işleri kısalt.' });
  if (cv.lang === 'en' && !cv.international && (p.showPhoto || p.birthDate))
    add({ id: 'intl', level: 'info', title: 'İngilizce CV’de fotoğraf veya doğum tarihi var', detail: 'Yurt dışı başvurularında “Uluslararası mod” bunları gizler.' });
  if (cv.design.linkStyle !== 'url' && cv.links.length)
    add({ id: 'linkstyle', level: 'warn', title: 'Bağlantı adresleri metin olarak yazılmıyor', detail: 'Platform adı/buton görünümünde bazı ATS’ler LinkedIn adresini göremez. Tasarım → İkonlar ve bağlantılar → Adres.' });
  if (cv.design.sizes.body < 9) add({ id: 'small', level: 'warn', title: 'Metin boyutu 9 pt’nin altında', detail: 'Yazdırıldığında okunması zorlaşır.' });

  return out;
}

export function score(checks: Check[]): number {
  const pen = checks.reduce((n, c) => n + (c.level === 'error' ? 18 : c.level === 'warn' ? 7 : c.level === 'info' ? 2 : 0), 0);
  return Math.max(0, Math.min(100, 100 - pen));
}
