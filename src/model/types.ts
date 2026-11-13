export type Lang = 'tr' | 'en';

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
  birthDate: string;
  birthFormat: BirthFormat;
  nationality: string;
  military: MilitaryStatus;
  militaryDate: MonthValue;
  licenses: string[];
  licenseYear: string;
  marital: MaritalStatus;
  travel: '' | 'yes' | 'no';
  photo: string;
  showPhoto: boolean;
}

export interface LinkItem {
  id: string;
  type: string;
  value: string;
  label: string;
}

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
  leading: number;
  paragraphGap: number;
  sectionGap: number;
  headingGap: number;
  entryGap: number;
  bulletGap: number;
  margins: { top: number; bottom: number; left: number; right: number };
  headingStyle: HeadingStyle;
  headingCase: 'upper' | 'normal';
  headingTracking: number;
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
  linkStyle: 'url' | 'label' | 'button';
  icons: { sections: boolean; contacts: boolean; color: 'accent' | 'text' | 'muted' };
  photo: { shape: 'rounded' | 'circle' | 'square'; size: number; position: 'right' | 'left' };
  linesLayout: 'inline' | 'table';
  bulletColor: 'accent' | 'muted';
  entryDivider: boolean;
  titleColor: 'accent' | 'muted';
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
  jobPosting: string;
  coverLetter: CoverLetter;
  sectionIcons: Partial<Record<SectionKey, string>>;
  design: Design;
}

export type EntrySectionKey = keyof CV['sections'];

export interface CoverLetter {
  company: string;
  position: string;
  recipient: string;
  city: string;
  date: string;
  greeting: string;
  body: string;
  closing: string;
}
