import type { Lang } from '../model/types';
import { unicodeWords } from './unicodeWord';

export interface Hint {
  kind: 'weak' | 'number' | 'long' | 'short' | 'first-person' | 'passive' | 'vague';
  text: string;
  suggestions?: string[];
}

export const STRONG_VERBS: Record<Lang, { group: string; verbs: string[] }[]> = {
  tr: [
    { group: 'Yönetim', verbs: ['yönettim', 'koordine ettim', 'liderlik ettim', 'planladım', 'denetledim'] },
    { group: 'Kurma ve geliştirme', verbs: ['kurdum', 'geliştirdim', 'tasarladım', 'oluşturdum', 'hayata geçirdim'] },
    { group: 'İyileştirme', verbs: ['azalttım', 'artırdım', 'hızlandırdım', 'otomatikleştirdim', 'iyileştirdim', 'sadeleştirdim'] },
    { group: 'Destek ve çözüm', verbs: ['çözdüm', 'giderdim', 'sağladım', 'eğittim', 'belgeledim'] },
    { group: 'Satış ve iletişim', verbs: ['kazandırdım', 'büyüttüm', 'müzakere ettim', 'sundum', 'ikna ettim'] },
  ],
  en: [
    { group: 'Leadership', verbs: ['led', 'managed', 'coordinated', 'planned', 'supervised'] },
    { group: 'Building', verbs: ['built', 'developed', 'designed', 'created', 'launched'] },
    { group: 'Improvement', verbs: ['reduced', 'increased', 'accelerated', 'automated', 'improved', 'streamlined'] },
    { group: 'Support', verbs: ['resolved', 'delivered', 'trained', 'documented', 'supported'] },
    { group: 'Sales', verbs: ['won', 'grew', 'negotiated', 'presented', 'secured'] },
  ],
};

const WEAK: Record<Lang, { re: RegExp; label: string }[]> = {
  tr: [
    { re: unicodeWords(/\bsorumlu(yd|ydu)?(um|m)\b|\bsorumlu oldum\b|\bsorumluluğundaydı\b/i), label: '“sorumluydum”' },
    { re: unicodeWords(/\bgörev (aldım|yaptım)\b/i), label: '“görev aldım”' },
    { re: unicodeWords(/\byardımcı oldum\b|\byardım ettim\b/i), label: '“yardımcı oldum”' },
    { re: unicodeWords(/\bilgilendim\b/i), label: '“ilgilendim”' },
    { re: unicodeWords(/\bçalıştım\b/i), label: '“çalıştım”' },
    { re: unicodeWords(/\bbulundum\b/i), label: '“bulundum”' },
  ],
  en: [
    { re: /\bresponsible for\b/i, label: '“responsible for”' },
    { re: /\bhelped\b|\bassisted\b/i, label: '“helped”' },
    { re: /\bworked on\b/i, label: '“worked on”' },
    { re: /\bduties included\b/i, label: '“duties included”' },
    { re: /\binvolved in\b/i, label: '“involved in”' },
  ],
};

const PASSIVE_TR = unicodeWords(/\b\w+(ıldı|ildi|uldu|üldü|ındı|indi|undu|ündü)\b[.!]?$/i);

const VAGUE: Record<Lang, RegExp> = {
  tr: unicodeWords(/\b(çeşitli|bazı|vb\.|vs\.|vb|vs|gibi işler|birçok|pek çok)(?!\w)/i),
  en: /\b(various|several|etc\.?|many|some)\b/i,
};

export function bulletHints(text: string, lang: Lang): Hint[] {
  const t = text.trim();
  if (t.length < 3) return [];
  const hints: Hint[] = [];
  const weak = WEAK[lang].find((w) => w.re.test(t));
  if (weak) {
    hints.push({
      kind: 'weak',
      text:
        lang === 'tr'
          ? `${weak.label} pasif kalıyor. Ne yaptığını ve sonucunu anlatan güçlü bir fiil kullan.`
          : `${weak.label} sounds passive. Use a strong verb that shows what you did and the result.`,
      suggestions: STRONG_VERBS[lang].flatMap((g) => g.verbs).slice(0, 8),
    });
  }
  if (lang === 'tr' && /\b(ben|benim)\b/i.test(t)) hints.push({ kind: 'first-person', text: '“Ben” demene gerek yok; fiil zaten senin yaptığını anlatıyor.' });
  if (lang === 'en' && /^(i|my)\b/i.test(t)) hints.push({ kind: 'first-person', text: 'Drop “I”; start with the verb.' });
  if (lang === 'tr' && PASSIVE_TR.test(t))
    hints.push({ kind: 'passive', text: 'Edilgen cümle (“yapıldı, sağlandı”). “Yaptım, sağladım” gibi etken anlatım daha güçlü durur.' });
  if (!/\d/.test(t))
    hints.push({
      kind: 'number',
      text: lang === 'tr' ? 'Sayı yok. Mümkünse ölç: kaç kişi, yüzde kaç, ne kadar sürede?' : 'No numbers. Quantify it: how many, what percent, how fast?',
    });
  if (VAGUE[lang].test(t)) hints.push({ kind: 'vague', text: lang === 'tr' ? 'Belirsiz ifade (“çeşitli, bazı, vb.”). Somut örnek ver.' : 'Vague word. Be specific.' });
  if (t.length > 220) hints.push({ kind: 'long', text: lang === 'tr' ? 'Madde çok uzun; 1-2 satırı geçmesin.' : 'Too long; keep it to 1-2 lines.' });
  else if (t.length < 25) hints.push({ kind: 'short', text: lang === 'tr' ? 'Çok kısa; ne yaptığını ve sonucunu ekle.' : 'Too short; add what you did and the result.' });
  return hints;
}

export const hasNumber = (t: string) => /\d/.test(t);
