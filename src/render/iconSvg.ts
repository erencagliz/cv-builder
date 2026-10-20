import icons from './icons.json';
import type { SectionKey } from '../model/types';

const DATA = icons as { generic: Record<string, string>; brands: Record<string, string>; labels: Record<string, string> };

export const GENERIC_ICONS = Object.keys(DATA.generic);
export const iconLabel = (id: string) => DATA.labels[id] ?? id;

/** Bölümlerin varsayılan ikonları */
export const DEFAULT_SECTION_ICONS: Record<string, string> = {
  summary: 'user-round',
  experience: 'briefcase',
  education: 'graduation-cap',
  skills: 'wrench',
  languages: 'languages',
  certificates: 'award',
  projects: 'folder-git-2',
  courses: 'book-open',
  volunteer: 'heart-handshake',
  awards: 'trophy',
  publications: 'newspaper',
  talks: 'mic',
  memberships: 'users',
  personal: 'id-card',
  hobbies: 'sparkles',
  references: 'user-check',
};
export const sectionIconId = (icons: Partial<Record<SectionKey, string>>, key: SectionKey): string =>
  icons[key] ?? (key.startsWith('custom:') ? 'star' : DEFAULT_SECTION_ICONS[key] ?? 'star');

/** İletişim satırı ikonu: marka logosu varsa o, yoksa genel ikon */
export function contactIconId(kind: string): string {
  if (DATA.brands[kind]) return `brand:${kind}`;
  switch (kind) {
    case 'location':
      return 'map-pin';
    case 'phone':
      return 'smartphone';
    case 'email':
      return 'mail';
    case 'website':
    case 'portfolio':
      return 'globe';
    default:
      return 'link';
  }
}

/** Typst'e ve önizlemeye giden, rengi uygulanmış bağımsız SVG */
export function iconSvg(id: string, color: string): string {
  if (!id || id === 'none') return '';
  if (id.startsWith('brand:')) {
    const body = DATA.brands[id.slice(6)];
    if (!body) return '';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}">${body}</svg>`;
  }
  const body = DATA.generic[id];
  if (!body) return '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}
