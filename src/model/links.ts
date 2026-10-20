export interface LinkType {
  id: string;
  name: string;
  /** {u} kullanıcı adıyla değiştirilir; yoksa değer tam URL olmalıdır */
  pattern?: string;
  placeholder: string;
}

export const LINK_TYPES: LinkType[] = [
  { id: 'linkedin', name: 'LinkedIn', pattern: 'https://www.linkedin.com/in/{u}', placeholder: 'kullanıcı adı veya profil linki' },
  { id: 'github', name: 'GitHub', pattern: 'https://github.com/{u}', placeholder: 'kullanıcı adı' },
  { id: 'gitlab', name: 'GitLab', pattern: 'https://gitlab.com/{u}', placeholder: 'kullanıcı adı' },
  { id: 'website', name: 'Web sitesi', placeholder: 'ornek.com' },
  { id: 'portfolio', name: 'Portfolyo', placeholder: 'portfolyo linki' },
  { id: 'behance', name: 'Behance', pattern: 'https://www.behance.net/{u}', placeholder: 'kullanıcı adı' },
  { id: 'dribbble', name: 'Dribbble', pattern: 'https://dribbble.com/{u}', placeholder: 'kullanıcı adı' },
  { id: 'medium', name: 'Medium', pattern: 'https://medium.com/@{u}', placeholder: 'kullanıcı adı' },
  { id: 'stackoverflow', name: 'Stack Overflow', placeholder: 'profil linki' },
  { id: 'kaggle', name: 'Kaggle', pattern: 'https://www.kaggle.com/{u}', placeholder: 'kullanıcı adı' },
  { id: 'youtube', name: 'YouTube', pattern: 'https://www.youtube.com/@{u}', placeholder: 'kanal adı' },
  { id: 'x', name: 'X (Twitter)', pattern: 'https://x.com/{u}', placeholder: 'kullanıcı adı' },
  { id: 'instagram', name: 'Instagram', pattern: 'https://www.instagram.com/{u}', placeholder: 'kullanıcı adı' },
  { id: 'artstation', name: 'ArtStation', pattern: 'https://www.artstation.com/{u}', placeholder: 'kullanıcı adı' },
  { id: 'scholar', name: 'Google Scholar', placeholder: 'profil linki' },
  { id: 'orcid', name: 'ORCID', pattern: 'https://orcid.org/{u}', placeholder: '0000-0000-0000-0000' },
  { id: 'itchio', name: 'itch.io', pattern: 'https://{u}.itch.io', placeholder: 'kullanıcı adı' },
  { id: 'roblox', name: 'Roblox', placeholder: 'profil linki' },
  { id: 'npm', name: 'npm', pattern: 'https://www.npmjs.com/~{u}', placeholder: 'kullanıcı adı' },
  { id: 'custom', name: 'Diğer', placeholder: 'https://…' },
];

export const LINK_MAP = Object.fromEntries(LINK_TYPES.map((t) => [t.id, t]));

const looksLikeUrl = (v: string) => /^https?:\/\//i.test(v) || /^[\w-]+(\.[\w-]+)+(\/|$)/.test(v);

/** Kullanıcının yazdığı değeri tam URL'ye çevirir. */
export function resolveLink(type: string, raw: string): string {
  const v = raw.trim();
  if (!v) return '';
  if (looksLikeUrl(v)) return /^https?:\/\//i.test(v) ? v : `https://${v}`;
  const t = LINK_MAP[type];
  if (t?.pattern) return t.pattern.replace('{u}', v.replace(/^@/, ''));
  return `https://${v}`;
}

/** PDF'te görünen, ATS'nin okuyacağı kısa biçim: linkedin.com/in/ad */
export function displayLink(url: string): string {
  return url
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/$/, '');
}

export function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return /^https?:$/.test(u.protocol) && u.hostname.includes('.');
  } catch {
    return false;
  }
}

/** Türkiye numarası mı? (+90 ile ya da 0/5/2/3/4 ile başlayan, en fazla 10 haneli ulusal kısım) */
function trNational(raw: string): string | null {
  const t = raw.trim();
  let d = t.replace(/\D/g, '');
  if (t.startsWith('+') || t.startsWith('00')) {
    if (t.startsWith('00')) d = d.slice(2);
    if (!d.startsWith('9')) return null; // başka ülke kodu
    if (d.length >= 2 && !d.startsWith('90')) return null;
    d = d.slice(2);
  } else if (d.startsWith('90') && d.length > 10) d = d.slice(2);
  else if (d.startsWith('0')) d = d.slice(1);
  // "+90 (" yazılıyken 0532… diye devam edilirse baştaki 0 ulusal koda ait değildir
  return d.replace(/^0+/, '').slice(0, 10);
}

/** Yazarken uygulanan maske: +90 (542) 355 56 49 */
export function maskPhone(raw: string): string {
  if (!raw.trim()) return '';
  const n = trNational(raw);
  if (n === null) return raw.replace(/[^\d+()\s-]/g, '').replace(/\s{2,}/g, ' '); // yabancı numara: serbest
  if (!n.length) return '+90 (';
  let out = `+90 (${n.slice(0, 3)}`;
  if (n.length >= 3) out += ')';
  if (n.length > 3) out += ` ${n.slice(3, 6)}`;
  if (n.length > 6) out += ` ${n.slice(6, 8)}`;
  if (n.length > 8) out += ` ${n.slice(8, 10)}`;
  return out;
}

/** Kaydedilmiş/içe aktarılan numarayı tek biçime getirir: +90 (5xx) xxx xx xx; Türkiye dışı numaralara dokunmaz. */
export function formatPhone(raw: string): string {
  const n = trNational(raw);
  if (n === null || n.length !== 10) return raw.trim();
  return maskPhone(n);
}

export const isCompletePhone = (v: string) => {
  const n = trNational(v);
  return n === null ? v.replace(/\D/g, '').length >= 8 : n.length === 10;
};

export function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
}
