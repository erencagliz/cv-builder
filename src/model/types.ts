export type Lang = 'tr' | 'en';

/** "YYYY-MM" veya "YYYY" ya da boş */
export type MonthValue = string;

export interface DateRange {
  start: MonthValue;
  end: MonthValue;
  current: boolean;
}

export type MilitaryStatus = '' | 'done' | 'exempt' | 'deferred' | 'na';
export type MaritalStatus = '' | 'single' | 'married';
export type BirthFormat = 'full' | 'year' | 'age';

export interface Personal {
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  birthDate: string; // YYYY-MM-DD
  birthFormat: BirthFormat;
  nationality: string;
  military: MilitaryStatus;
  militaryDate: MonthValue;
  licenses: string[];
  licenseYear: string;
  marital: MaritalStatus;
  travel: '' | 'yes' | 'no';
  photo: string; // data URL (jpeg)
  showPhoto: boolean;
}

export interface LinkItem {
  id: string;
  type: string;
  value: string;
  label: string;
}

/** Bölüm girdileri esnek alanlıdır; alanlar sections.ts içinde tanımlanır. */
export interface Entry {
  id: string;
  [field: string]: unknown;
}

export interface CustomSection {
  id: string;
  title: string;
  items: Entry[];
}

export type BuiltinSectionKey =
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'languages'
  | 'certificates'
  | 'projects'
  | 'courses'
  | 'volunteer'
  | 'awards'
  | 'publications'
  | 'talks'
  | 'memberships'
  | 'personal'
  | 'hobbies'
  | 'references';

/** custom bölümler "custom:<id>" anahtarıyla sıralanır */
export type SectionKey = BuiltinSectionKey | `custom:${string}`;

export type HeadingStyle = 'rule' | 'line-after' | 'plain' | 'bar' | 'filled';
export type DateFormat = 'MMM YYYY' | 'MMMM YYYY' | 'MM/YYYY' | 'YYYY-MM' | 'YYYY';

export interface Design {
  template: string;
  paper: 'a4' | 'us-letter';
  colors: { accent: string; text: string; muted: string; rule: string };
  headingColor: 'accent' | 'text';
  nameColor: 'accent' | 'text';
  fonts: { heading: string; body: string };
  sizes: {
    name: number;
    title: number;
    heading: number;
    entryTitle: number;
    body: number;
    meta: number;
  };
  leading: number; // em
  paragraphGap: number; // pt
  sectionGap: number; // pt
  headingGap: number; // pt
  entryGap: number; // pt
  bulletGap: number; // pt
  margins: { top: number; bottom: number; left: number; right: number }; // mm
  headingStyle: HeadingStyle;
  headingCase: 'upper' | 'normal';
  headingTracking: number; // pt
  headingWeight: 'bold' | 'semibold' | 'regular';
  nameCase: 'upper' | 'normal';
  nameAlign: 'left' | 'center';
  bullet: string;
  dateFormat: DateFormat;
  datePosition: 'right' | 'below' | 'inline';
  contactSeparator: string;
  linkLabels: boolean;
  underlineLinks: boolean;
  groupRoles: boolean;
  personalInline: boolean;
  /** Bağlantılar: tam adres, platform adı veya buton */
  linkStyle: 'url' | 'label' | 'button';
  icons: { sections: boolean; contacts: boolean; color: 'accent' | 'text' | 'muted' };
  photo: { shape: 'rounded' | 'circle' | 'square'; size: number; position: 'right' | 'left' };
  /** Yetenek ve dil satırları: "Grup: a, b" ya da iki sütunlu tablo */
  linesLayout: 'inline' | 'table';
  bulletColor: 'accent' | 'muted';
  /** Deneyim gibi girdilerin arasına ince çizgi */
  entryDivider: boolean;
  titleColor: 'accent' | 'muted';
  /** Vurgu çizgisi rengi: çizgi rengi mi vurgu rengi mi */
  ruleColor: 'rule' | 'accent';
}

export interface CV {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  lang: Lang;
  international: boolean;
  personal: Personal;
  links: LinkItem[];
  summary: string;
  hobbies: string;
  references: { onRequest: boolean; items: Entry[] };
  sections: Record<Exclude<BuiltinSectionKey, 'summary' | 'personal' | 'hobbies' | 'references'>, Entry[]>;
  custom: CustomSection[];
  order: SectionKey[];
  hidden: SectionKey[];
  titles: Partial<Record<SectionKey, string>>;
  /** Başvurulan ilanın metni (ilan eşleştirme için) */
  jobPosting: string;
  coverLetter: CoverLetter;
  /** Bölüm başlığı ikonları (ikon kimliği veya "none") */
  sectionIcons: Partial<Record<SectionKey, string>>;
  design: Design;
}

export type EntrySectionKey = keyof CV['sections'];

export interface CoverLetter {
  company: string;
  position: string;
  recipient: string; // ör. "İnsan Kaynakları Departmanı"
  city: string;
  date: string; // YYYY-MM-DD, boşsa bugünün tarihi
  greeting: string;
  body: string; // paragraflar boş satırla ayrılır
  closing: string;
}
