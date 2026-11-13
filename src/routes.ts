export type Lang = 'en' | 'tr';
export type RouteName = 'home' | 'edit' | 'view';

export interface Route {
  name: RouteName;
  lang: Lang | null;
  id?: string;
}

export const LANGS: readonly Lang[] = ['en', 'tr'];
export const DEFAULT_LANG: Lang = 'en';

const SLUGS: Record<Lang, Record<Exclude<RouteName, 'home'>, string>> = {
  en: { edit: 'edit', view: 'view' },
  tr: { edit: 'duzenle', view: 'goruntule' },
};

const isLang = (s: string | undefined): s is Lang => !!s && (LANGS as readonly string[]).includes(s);
const prefix = (lang: Lang) => (lang === DEFAULT_LANG ? '' : `/${lang}`);

export function buildPath(route: Route, lang: Lang = route.lang ?? DEFAULT_LANG): string {
  if (route.name === 'home') return `${prefix(lang)}/`;
  const base = `${prefix(lang)}/${SLUGS[lang][route.name]}`;
  return route.name === 'edit' && route.id ? `${base}/${route.id}` : base;
}

export function parsePath(pathname: string): Route {
  const parts = pathname.split('/').filter(Boolean);
  const explicit = isLang(parts[0]) ? (parts.shift() as Lang) : null;
  const [slug, id] = parts;
  if (!slug) return { name: 'home', lang: explicit };
  for (const l of LANGS) {
    for (const [name, s] of Object.entries(SLUGS[l]) as [Exclude<RouteName, 'home'>, string][]) {
      if (s !== slug) continue;
      const lang = explicit ?? l;
      if (name === 'view') return { name, lang };
      if (id && /^[\w-]+$/.test(id)) return { name, lang, id };
      return { name: 'home', lang };
    }
  }
  return { name: 'home', lang: explicit };
}

export const canonicalPath = (pathname: string, lang: Lang) => buildPath(parsePath(pathname), lang);
