import type { Design } from './types';

export const BASE_DESIGN: Design = {
  template: 'modern',
  paper: 'a4',
  colors: { accent: '#1F4E8C', text: '#1B1F24', muted: '#545B66', rule: '#C9CED6' },
  headingColor: 'accent',
  nameColor: 'text',
  fonts: { heading: 'source-sans-3', body: 'source-sans-3' },
  sizes: { name: 24, title: 12, heading: 11.5, entryTitle: 10.5, body: 10, meta: 9.5 },
  leading: 0.62,
  paragraphGap: 5,
  sectionGap: 13,
  headingGap: 6,
  entryGap: 8,
  bulletGap: 3.5,
  margins: { top: 15, bottom: 15, left: 17, right: 17 },
  headingStyle: 'rule',
  headingCase: 'upper',
  headingTracking: 0.6,
  headingWeight: 'bold',
  nameCase: 'normal',
  nameAlign: 'left',
  bullet: '•',
  dateFormat: 'MMM YYYY',
  datePosition: 'right',
  contactSeparator: '·',
  linkLabels: false,
  underlineLinks: false,
  groupRoles: true,
  personalInline: true,
  linkStyle: 'url',
  icons: { sections: false, contacts: false, color: 'accent' },
  photo: { shape: 'rounded', size: 26, position: 'right' },
  linesLayout: 'inline',
  bulletColor: 'muted',
  entryDivider: false,
  titleColor: 'muted',
  ruleColor: 'rule',
};

const PLAIN: Partial<Design> = {
  icons: { sections: false, contacts: false, color: 'accent' },
  linesLayout: 'inline',
  bulletColor: 'muted',
  entryDivider: false,
  titleColor: 'muted',
  ruleColor: 'rule',
  datePosition: 'right',
  headingWeight: 'bold',
};

export interface TemplateDef {
  id: string;
  name: string;
  description: string;
  apply: Partial<Design> & { sizes?: Partial<Design['sizes']> };
}

export const TEMPLATES: TemplateDef[] = [
  {
    id: 'signature',
    name: 'İmza',
    description: 'Varsayılan. İkonlu başlıklar, satır içi tarihler, beceri tablosu.',
    apply: {
      ...PLAIN,
      fonts: { heading: 'inter', body: 'inter' },
      icons: { sections: true, contacts: true, color: 'accent' },
      headingStyle: 'rule',
      headingCase: 'upper',
      headingColor: 'accent',
      ruleColor: 'accent',
      nameColor: 'text',
      titleColor: 'accent',
      nameAlign: 'left',
      nameCase: 'normal',
      headingTracking: 0.4,
      datePosition: 'inline',
      linesLayout: 'table',
      bulletColor: 'accent',
      entryDivider: true,
      sizes: { name: 21, title: 11, heading: 9.5, entryTitle: 9.5, body: 9, meta: 8.5 },
      leading: 0.6,
      paragraphGap: 4,
      sectionGap: 12,
      headingGap: 6,
      entryGap: 8,
      bulletGap: 2.5,
      margins: { top: 14, bottom: 14, left: 16, right: 16 },
    },
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Sola hizalı, renkli başlıklar, sade çizgiler.',
    apply: {
      ...PLAIN,
      fonts: { heading: 'source-sans-3', body: 'source-sans-3' },
      headingStyle: 'rule',
      headingCase: 'upper',
      headingColor: 'accent',
      nameColor: 'text',
      nameAlign: 'left',
      nameCase: 'normal',
      headingTracking: 0.6,
      sizes: { name: 24, title: 12, heading: 11.5, entryTitle: 10.5, body: 10, meta: 9.5 },
      leading: 0.62,
      sectionGap: 13,
      entryGap: 8,
      margins: { top: 15, bottom: 15, left: 17, right: 17 },
    },
  },
  {
    id: 'classic',
    name: 'Klasik',
    description: 'Ortalanmış ad, serif yazı, ince ayırıcılar. Her sektörde güvenli.',
    apply: {
      ...PLAIN,
      fonts: { heading: 'source-serif-4', body: 'source-serif-4' },
      headingStyle: 'rule',
      headingCase: 'upper',
      headingColor: 'text',
      nameColor: 'text',
      nameAlign: 'center',
      nameCase: 'normal',
      headingTracking: 0.6,
      sizes: { name: 22, title: 11.5, heading: 11, entryTitle: 10.5, body: 10, meta: 9.5 },
      leading: 0.6,
      sectionGap: 12,
      entryGap: 8,
      margins: { top: 16, bottom: 16, left: 18, right: 18 },
    },
  },
  {
    id: 'compact',
    name: 'Kompakt',
    description: 'Sıkı aralıklar, çok bilgiyi tek sayfaya sığdırır.',
    apply: {
      ...PLAIN,
      linesLayout: 'table',
      fonts: { heading: 'ibm-plex-sans', body: 'ibm-plex-sans' },
      headingStyle: 'line-after',
      headingCase: 'upper',
      headingColor: 'accent',
      nameColor: 'accent',
      nameAlign: 'left',
      nameCase: 'normal',
      headingTracking: 0.4,
      sizes: { name: 20, title: 11, heading: 10.5, entryTitle: 10, body: 9.5, meta: 9 },
      leading: 0.55,
      sectionGap: 9,
      entryGap: 6,
      margins: { top: 12, bottom: 12, left: 14, right: 14 },
    },
  },
  {
    id: 'executive',
    name: 'Yönetici',
    description: 'Büyük ad, geniş boşluklar, ağırbaşlı görünüm.',
    apply: {
      ...PLAIN,
      fonts: { heading: 'eb-garamond', body: 'source-sans-3' },
      headingStyle: 'plain',
      headingCase: 'upper',
      headingColor: 'accent',
      nameColor: 'text',
      nameAlign: 'left',
      nameCase: 'upper',
      headingTracking: 0.6,
      sizes: { name: 28, title: 12.5, heading: 11.5, entryTitle: 10.5, body: 10, meta: 9.5 },
      leading: 0.68,
      sectionGap: 16,
      entryGap: 10,
      margins: { top: 20, bottom: 18, left: 20, right: 20 },
    },
  },
  {
    id: 'technical',
    name: 'Teknik',
    description: 'Yazılım ve bilgi işlem için; başlıklar renkli blokta, yetenekler öne çıkar.',
    apply: {
      ...PLAIN,
      fonts: { heading: 'fira-sans', body: 'noto-sans' },
      headingStyle: 'bar',
      headingCase: 'normal',
      headingColor: 'text',
      nameColor: 'accent',
      nameAlign: 'left',
      nameCase: 'normal',
      headingTracking: 0,
      sizes: { name: 23, title: 11.5, heading: 12, entryTitle: 10.5, body: 9.5, meta: 9 },
      leading: 0.6,
      sectionGap: 12,
      entryGap: 7,
      margins: { top: 14, bottom: 14, left: 16, right: 16 },
    },
  },
  {
    id: 'academic',
    name: 'Akademik',
    description: 'Klasik serif, eğitim ve yayınlar için uygun, sade siyah-beyaz.',
    apply: {
      ...PLAIN,
      fonts: { heading: 'noto-serif', body: 'noto-serif' },
      headingStyle: 'line-after',
      headingCase: 'normal',
      headingColor: 'text',
      nameColor: 'text',
      nameAlign: 'center',
      nameCase: 'normal',
      headingTracking: 0,
      sizes: { name: 20, title: 11, heading: 12, entryTitle: 10, body: 9.5, meta: 9 },
      leading: 0.6,
      sectionGap: 12,
      entryGap: 7,
      margins: { top: 18, bottom: 18, left: 20, right: 20 },
    },
  },
];

export function applyTemplate(design: Design, id: string): Design {
  const t = TEMPLATES.find((x) => x.id === id);
  if (!t) return design;
  const { sizes, ...rest } = t.apply;
  return { ...design, ...structuredClone(rest), sizes: { ...design.sizes, ...(sizes ?? {}) }, photo: design.photo, colors: design.colors, template: id };
}

export const COLOR_PRESETS = [
  { name: 'Şarap', value: '#7E2A3B' },
  { name: 'Lacivert', value: '#1F4E8C' },
  { name: 'Gece', value: '#1E2A44' },
  { name: 'Petrol', value: '#0E6170' },
  { name: 'Orman', value: '#2D6A45' },
  { name: 'Bordo', value: '#8A1C2B' },
  { name: 'Mürdüm', value: '#5B2A6E' },
  { name: 'Kehribar', value: '#9A5B13' },
  { name: 'Grafit', value: '#3A4049' },
  { name: 'Siyah', value: '#111111' },
];

export const BULLETS = ['•', '–', '·', '›'];
export const SEPARATORS = ['·', '|', '•', '/'];

export function defaultDesign(): Design {
  const d = applyTemplate(structuredClone(BASE_DESIGN), 'signature');
  d.colors = { accent: '#7E2A3B', text: '#1B1F24', muted: '#5A5F69', rule: '#D6C3C8' };
  return d;
}
