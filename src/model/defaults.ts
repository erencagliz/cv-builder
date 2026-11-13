import { nanoid } from 'nanoid';
import type { CV, CoverLetter, Entry, Personal, SectionKey } from './types';
import { BASE_DESIGN, defaultDesign } from './templates';

export const uid = () => nanoid(10);

export const DEFAULT_ORDER: SectionKey[] = [
  'summary',
  'experience',
  'education',
  'skills',
  'languages',
  'certificates',
  'projects',
  'courses',
  'volunteer',
  'awards',
  'publications',
  'talks',
  'memberships',
  'personal',
  'hobbies',
  'references',
];

export const EMPTY_PERSONAL: Personal = {
  firstName: '',
  lastName: '',
  title: '',
  email: '',
  phone: '',
  location: '',
  birthDate: '',
  birthFormat: 'full',
  nationality: '',
  military: '',
  militaryDate: '',
  licenses: [],
  licenseYear: '',
  marital: '',
  travel: '',
  photo: '',
  showPhoto: false,
};

export const EMPTY_LETTER: CoverLetter = {
  company: '',
  position: '',
  recipient: '',
  city: '',
  date: '',
  greeting: '',
  body: '',
  closing: '',
};

export function emptyCV(name = 'Yeni CV'): CV {
  const now = Date.now();
  return {
    id: uid(),
    name,
    createdAt: now,
    updatedAt: now,
    lang: 'tr',
    international: false,
    personal: { ...EMPTY_PERSONAL },
    links: [],
    summary: '',
    hobbies: '',
    references: { onRequest: false, items: [] },
    sections: {
      experience: [],
      education: [],
      skills: [],
      languages: [],
      certificates: [],
      projects: [],
      courses: [],
      volunteer: [],
      awards: [],
      publications: [],
      talks: [],
      memberships: [],
    },
    custom: [],
    order: [...DEFAULT_ORDER],
    hidden: [],
    titles: {},
    sectionIcons: {},
    jobPosting: '',
    coverLetter: { ...EMPTY_LETTER },
    design: defaultDesign(),
  };
}

export const newEntry = (fields: Record<string, unknown> = {}): Entry => ({ id: uid(), ...fields });

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

export function normalizeCV(input: unknown): CV {
  const base = emptyCV();
  if (!isObj(input)) return base;
  const src = input as Partial<CV>;
  const cv: CV = {
    ...base,
    ...src,
    id: typeof src.id === 'string' ? src.id : base.id,
    personal: { ...base.personal, ...(isObj(src.personal) ? src.personal : {}) } as Personal,
    links: Array.isArray(src.links) ? src.links.map((l) => ({ id: l.id || uid(), type: l.type || 'custom', value: l.value ?? '', label: l.label ?? '' })) : [],
    references: {
      onRequest: !!src.references?.onRequest,
      items: Array.isArray(src.references?.items) ? src.references!.items.map(withId) : [],
    },
    sections: { ...base.sections },
    custom: Array.isArray(src.custom)
      ? src.custom.map((c) => ({ id: c.id || uid(), title: c.title || 'Özel bölüm', items: (c.items || []).map(withId) }))
      : [],
    titles: isObj(src.titles) ? src.titles : {},
    sectionIcons: isObj(src.sectionIcons) ? src.sectionIcons : {},
    jobPosting: typeof src.jobPosting === 'string' ? src.jobPosting : '',
    coverLetter: { ...EMPTY_LETTER, ...(isObj(src.coverLetter) ? src.coverLetter : {}) },
    hidden: Array.isArray(src.hidden) ? src.hidden : [],
    design: {
      ...base.design,
      ...(isObj(src.design) ? src.design : {}),
      colors: { ...base.design.colors, ...(isObj(src.design?.colors) ? src.design!.colors : {}) },
      fonts: { ...base.design.fonts, ...(isObj(src.design?.fonts) ? src.design!.fonts : {}) },
      sizes: { ...base.design.sizes, ...(isObj(src.design?.sizes) ? src.design!.sizes : {}) },
      margins: { ...base.design.margins, ...(isObj(src.design?.margins) ? src.design!.margins : {}) },
      icons: { ...base.design.icons, ...(isObj(src.design?.icons) ? src.design!.icons : {}) },
      photo: { ...base.design.photo, ...(isObj(src.design?.photo) ? src.design!.photo : {}) },
    },
  };
  if (isObj(src.design)) {
    for (const [k, v] of Object.entries(BASE_DESIGN)) {
      if ((src.design as Record<string, unknown>)[k] === undefined) (cv.design as unknown as Record<string, unknown>)[k] = structuredClone(v);
    }
  }
  return finish(cv, src);
}

function finish(cv: CV, src: Partial<CV>): CV {
  if (isObj(src.sections)) {
    for (const k of Object.keys(cv.sections) as (keyof CV['sections'])[]) {
      const arr = (src.sections as Record<string, unknown>)[k];
      if (Array.isArray(arr)) cv.sections[k] = arr.map(withId);
    }
  }
  const known = new Set<string>([...DEFAULT_ORDER, ...cv.custom.map((c) => `custom:${c.id}`)]);
  const order = (Array.isArray(src.order) ? src.order : []).filter((k) => known.has(k));
  for (const k of known) if (!order.includes(k as SectionKey)) order.push(k as SectionKey);
  cv.order = order as SectionKey[];
  return cv;
}

function withId(e: unknown): Entry {
  const o = isObj(e) ? e : {};
  return { ...o, id: typeof o.id === 'string' ? o.id : uid() } as Entry;
}
