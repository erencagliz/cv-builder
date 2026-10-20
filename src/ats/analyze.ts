import type { CV } from '../model/types';
import type { RenderModel } from '../render/buildModel';
import { resolveLink, displayLink } from '../model/links';
import type { Check } from './quality';

/** Karşılaştırma için: Türkçe küçük harf, tek boşluk */
export const norm = (t: string) => t.toLocaleLowerCase('tr-TR').replace(/[‐-―]/g, '-').replace(/\s+/g, ' ').trim();

/**
 * PDF'ten geri okunan metne bakarak bir ATS'nin bilgileri bulup bulamayacağını denetler.
 * Gerçek ATS'ler farklı ayrıştırıcılar kullanır; bu denetim en yaygın yöntemi (içerik akışı sırasıyla metin) taklit eder.
 */
export function atsChecks(text: string, cv: CV, model: RenderModel): Check[] {
  const T = norm(text);
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const out: Check[] = [];
  const name = [cv.personal.firstName, cv.personal.lastName].join(' ').trim();

  if (text.includes('�')) out.push({ id: 'garbled', level: 'error', title: 'PDF’te okunamayan karakter var', detail: 'Bir karakter ATS’ye “�” olarak gidiyor.' });

  if (name) {
    const firstLines = norm(lines.slice(0, 3).join(' '));
    if (firstLines.includes(norm(name))) out.push({ id: 'ats-name', level: 'ok', title: 'Ad soyad en üstte okunuyor', detail: name });
    else if (T.includes(norm(name))) out.push({ id: 'ats-name', level: 'warn', title: 'Ad soyad bulundu ama en üstte değil' });
    else out.push({ id: 'ats-name', level: 'error', title: 'Ad soyad metinde bulunamadı' });
  }
  const email = cv.personal.email.trim();
  if (email) {
    if (T.includes(norm(email))) out.push({ id: 'ats-email', level: 'ok', title: 'E-posta okunuyor', detail: email });
    else out.push({ id: 'ats-email', level: 'error', title: 'E-posta metinde bulunamadı' });
  }
  const phoneDigits = cv.personal.phone.replace(/\D/g, '');
  if (phoneDigits) {
    if (text.replace(/\D/g, '').includes(phoneDigits.slice(-10))) out.push({ id: 'ats-phone', level: 'ok', title: 'Telefon okunuyor', detail: cv.personal.phone });
    else out.push({ id: 'ats-phone', level: 'error', title: 'Telefon metinde bulunamadı' });
  }
  for (const l of cv.links) {
    const url = resolveLink(l.type, l.value);
    if (!url) continue;
    const shown = displayLink(url);
    if (T.includes(norm(shown))) out.push({ id: `ats-link-${l.id}`, level: 'ok', title: `Bağlantı okunuyor`, detail: shown });
    else
      out.push({
        id: `ats-link-${l.id}`,
        level: 'warn',
        title: `${shown} metin olarak yazılmıyor`,
        detail: 'Tıklanabilir ama ATS adresi göremeyebilir. Tasarım → Bağlantılar → “Adres”.',
      });
  }
  // bölüm başlıkları
  const lineSet = new Set(lines.map(norm));
  const missingHeads = model.sections.filter((sec) => !lineSet.has(norm(sec.title)));
  if (model.sections.length) {
    if (!missingHeads.length) out.push({ id: 'ats-heads', level: 'ok', title: `${model.sections.length} bölüm başlığının hepsi ayrı satırda okunuyor` });
    else out.push({ id: 'ats-heads', level: 'warn', title: `Şu başlıklar ayrı satır olarak okunmuyor: ${missingHeads.map((h) => h.title).join(', ')}` });
  }
  // tarihler
  const expItems = model.sections.find((x) => x.key === 'experience')?.items ?? [];
  const datesExpected = expItems.flatMap((it) => (it.roles.length ? it.roles.map((r) => r.date) : [it.date])).filter(Boolean);
  const datesFound = datesExpected.filter((d) => T.includes(norm(d)));
  if (datesExpected.length) {
    if (datesFound.length === datesExpected.length) out.push({ id: 'ats-dates', level: 'ok', title: `Deneyim tarihlerinin hepsi okunuyor (${datesFound.length})` });
    else out.push({ id: 'ats-dates', level: 'warn', title: `Deneyim tarihlerinden ${datesExpected.length - datesFound.length} tanesi okunamadı` });
  }
  // kelime bölünmesi: yetenekler bütün olarak geçiyor mu?
  const skills = cv.sections.skills.flatMap((k) => (Array.isArray(k.items) ? (k.items as string[]) : [])).filter(Boolean);
  const broken = skills.filter((k) => !T.includes(norm(k)));
  if (skills.length) {
    if (!broken.length) out.push({ id: 'ats-skills', level: 'ok', title: `${skills.length} yeteneğin hepsi bölünmeden okunuyor` });
    else out.push({ id: 'ats-skills', level: 'warn', title: `Bölünmüş okunan yetenekler: ${broken.slice(0, 5).join(', ')}` });
  }
  const words = T.split(/\s+/).length;
  out.push({ id: 'ats-words', level: words < 150 ? 'warn' : 'ok', title: `Metin ${words} kelime`, detail: words < 150 ? 'Çok kısa; ATS’nin eşleştireceği kelime az.' : undefined });
  return out;
}
