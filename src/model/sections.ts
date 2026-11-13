import type { BuiltinSectionKey, EntrySectionKey, Lang } from './types';

export type FieldType = 'text' | 'textarea' | 'select' | 'range' | 'month' | 'tags' | 'bullets' | 'url';

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  hint?: string;
  options?: { value: string; label: string }[];
  wide?: boolean;
}

export interface SectionDef {
  key: BuiltinSectionKey;
  label: string;
  title: Record<Lang, string>;
  description: string;
  kind: 'entries' | 'text' | 'personal' | 'references';
  fields?: FieldDef[];
  summary?: (e: Record<string, unknown>) => string;
  addLabel?: string;
}

const s = (v: unknown) => (typeof v === 'string' ? v : '');
const join = (...parts: unknown[]) => parts.map(s).filter(Boolean).join(' · ');

export const EMPLOYMENT_TYPES = [
  { value: '', label: 'Belirtme' },
  { value: 'fulltime', label: 'Tam zamanlı' },
  { value: 'parttime', label: 'Yarı zamanlı' },
  { value: 'intern', label: 'Stajyer' },
  { value: 'freelance', label: 'Serbest' },
  { value: 'contract', label: 'Sözleşmeli' },
];
export const WORK_MODES = [
  { value: '', label: 'Belirtme' },
  { value: 'onsite', label: 'Ofisten' },
  { value: 'remote', label: 'Uzaktan' },
  { value: 'hybrid', label: 'Hibrit' },
];
export const DEGREES = [
  { value: '', label: 'Belirtme' },
  { value: 'highschool', label: 'Lise' },
  { value: 'associate', label: 'Ön lisans' },
  { value: 'bachelor', label: 'Lisans' },
  { value: 'master', label: 'Yüksek lisans' },
  { value: 'phd', label: 'Doktora' },
  { value: 'certificate', label: 'Sertifika programı' },
  { value: 'exchange', label: 'Değişim programı' },
];
export const GPA_SCALES = [
  { value: '4', label: '4,00 üzerinden' },
  { value: '5', label: '5,00 üzerinden' },
  { value: '100', label: '100 üzerinden' },
];
export const LANGUAGE_LEVELS = [
  { value: '', label: 'Belirtme' },
  { value: 'native', label: 'Ana dil' },
  { value: 'C2', label: 'C2 – Uzman' },
  { value: 'C1', label: 'C1 – İleri' },
  { value: 'B2', label: 'B2 – Orta üstü' },
  { value: 'B1', label: 'B1 – Orta' },
  { value: 'A2', label: 'A2 – Temel' },
  { value: 'A1', label: 'A1 – Başlangıç' },
  { value: 'advanced', label: 'İleri (sözel)' },
  { value: 'intermediate', label: 'Orta (sözel)' },
  { value: 'beginner', label: 'Başlangıç (sözel)' },
];
export const SKILL_LEVELS = [
  { value: '', label: 'Belirtme' },
  { value: 'expert', label: 'Uzman' },
  { value: 'advanced', label: 'İleri' },
  { value: 'intermediate', label: 'Orta' },
  { value: 'beginner', label: 'Temel' },
];

const range: FieldDef = { key: 'dates', label: 'Tarihler', type: 'range', wide: true };
const description: FieldDef = {
  key: 'description',
  label: 'Açıklama',
  type: 'textarea',
  wide: true,
  hint: '**kalın** ve *italik* yazabilirsin.',
};
const bullets: FieldDef = {
  key: 'bullets',
  label: 'Başarılar / maddeler',
  type: 'bullets',
  wide: true,
  hint: 'Her madde bir fiille başlasın ve mümkünse sayı içersin: "Ağdaki kesinti süresini %40 azalttım."',
};

export const SECTION_DEFS: SectionDef[] = [
  {
    key: 'summary',
    label: 'Özet',
    title: { tr: 'Profil', en: 'Summary' },
    description: 'Kim olduğunu ve ne aradığını 2-4 cümlede anlat.',
    kind: 'text',
  },
  {
    key: 'experience',
    label: 'İş Deneyimi',
    title: { tr: 'İş Deneyimi', en: 'Experience' },
    description: 'En yeni işten eskiye doğru sırala.',
    kind: 'entries',
    addLabel: 'Deneyim ekle',
    summary: (e) => join(e.position, e.company),
    fields: [
      { key: 'position', label: 'Pozisyon', type: 'text', placeholder: 'Bilgi İşlem Uzmanı' },
      { key: 'company', label: 'Şirket', type: 'text', placeholder: 'Şirket adı' },
      { key: 'location', label: 'Şehir', type: 'text', placeholder: 'İstanbul' },
      { key: 'employmentType', label: 'Çalışma tipi', type: 'select', options: EMPLOYMENT_TYPES },
      { key: 'workMode', label: 'Çalışma şekli', type: 'select', options: WORK_MODES },
      range,
      description,
      bullets,
      { key: 'tags', label: 'Kullanılan teknolojiler / araçlar', type: 'tags', wide: true, placeholder: 'Enter ile ekle' },
    ],
  },
  {
    key: 'education',
    label: 'Eğitim',
    title: { tr: 'Eğitim', en: 'Education' },
    description: 'En son mezun olduğun okuldan başla.',
    kind: 'entries',
    addLabel: 'Eğitim ekle',
    summary: (e) => join(e.school, e.field),
    fields: [
      { key: 'school', label: 'Okul', type: 'text', placeholder: 'Üniversite / lise adı', wide: true },
      { key: 'degree', label: 'Derece', type: 'select', options: DEGREES },
      { key: 'field', label: 'Bölüm / alan', type: 'text', placeholder: 'Bilgisayar Mühendisliği' },
      { key: 'location', label: 'Şehir', type: 'text' },
      { key: 'gpa', label: 'Not ortalaması', type: 'text', placeholder: '3,45' },
      { key: 'gpaScale', label: 'Not ölçeği', type: 'select', options: GPA_SCALES },
      { key: 'honors', label: 'Derece / onur', type: 'text', placeholder: 'Yüksek onur' },
      range,
      description,
      { key: 'tags', label: 'İlgili dersler', type: 'tags', wide: true },
    ],
  },
  {
    key: 'skills',
    label: 'Yetenekler',
    title: { tr: 'Yetenekler', en: 'Skills' },
    description: 'Yetenekleri gruplara ayır. Seviye grafikleri yerine metin kullanıyoruz; ATS grafikleri okuyamaz.',
    kind: 'entries',
    addLabel: 'Yetenek grubu ekle',
    summary: (e) => s(e.name) || (Array.isArray(e.items) ? (e.items as string[]).slice(0, 4).join(', ') : ''),
    fields: [
      { key: 'name', label: 'Grup adı', type: 'text', placeholder: 'Sistem yönetimi' },
      { key: 'level', label: 'Seviye', type: 'select', options: SKILL_LEVELS },
      { key: 'items', label: 'Yetenekler', type: 'tags', wide: true, placeholder: 'Active Directory, Group Policy…' },
    ],
  },
  {
    key: 'languages',
    label: 'Diller',
    title: { tr: 'Yabancı Diller', en: 'Languages' },
    description: 'Sınav puanın varsa ekle; işverenler sayıya güvenir.',
    kind: 'entries',
    addLabel: 'Dil ekle',
    summary: (e) => join(e.language, LANGUAGE_LEVELS.find((l) => l.value === e.level && l.value)?.label ?? ''),
    fields: [
      { key: 'language', label: 'Dil', type: 'text', placeholder: 'İngilizce' },
      { key: 'level', label: 'Seviye', type: 'select', options: LANGUAGE_LEVELS },
      { key: 'exam', label: 'Sınav', type: 'text', placeholder: 'YDS, IELTS, TOEFL…' },
      { key: 'score', label: 'Puan', type: 'text', placeholder: '85' },
    ],
  },
  {
    key: 'certificates',
    label: 'Sertifikalar',
    title: { tr: 'Sertifikalar', en: 'Certifications' },
    description: '',
    kind: 'entries',
    addLabel: 'Sertifika ekle',
    summary: (e) => join(e.name, e.issuer),
    fields: [
      { key: 'name', label: 'Sertifika adı', type: 'text', placeholder: 'CCNA', wide: true },
      { key: 'issuer', label: 'Veren kurum', type: 'text', placeholder: 'Cisco' },
      { key: 'date', label: 'Tarih', type: 'month' },
      { key: 'expires', label: 'Geçerlilik sonu', type: 'month' },
      { key: 'credentialId', label: 'Sertifika numarası', type: 'text' },
      { key: 'url', label: 'Doğrulama bağlantısı', type: 'url', wide: true },
    ],
  },
  {
    key: 'projects',
    label: 'Projeler',
    title: { tr: 'Projeler', en: 'Projects' },
    description: 'Kişisel, okul veya iş projelerin.',
    kind: 'entries',
    addLabel: 'Proje ekle',
    summary: (e) => join(e.name, e.role),
    fields: [
      { key: 'name', label: 'Proje adı', type: 'text' },
      { key: 'role', label: 'Rolün', type: 'text', placeholder: 'Geliştirici' },
      { key: 'url', label: 'Bağlantı', type: 'url', wide: true },
      range,
      description,
      bullets,
      { key: 'tags', label: 'Teknolojiler', type: 'tags', wide: true },
    ],
  },
  {
    key: 'courses',
    label: 'Kurslar ve Eğitimler',
    title: { tr: 'Kurslar ve Eğitimler', en: 'Courses' },
    description: '',
    kind: 'entries',
    addLabel: 'Kurs ekle',
    summary: (e) => join(e.name, e.institution),
    fields: [
      { key: 'name', label: 'Kurs adı', type: 'text', wide: true },
      { key: 'institution', label: 'Kurum', type: 'text' },
      { key: 'hours', label: 'Süre', type: 'text', placeholder: '40 saat' },
      { key: 'date', label: 'Tarih', type: 'month' },
      description,
    ],
  },
  {
    key: 'volunteer',
    label: 'Gönüllü Çalışmalar',
    title: { tr: 'Gönüllü Çalışmalar', en: 'Volunteering' },
    description: '',
    kind: 'entries',
    addLabel: 'Gönüllü çalışma ekle',
    summary: (e) => join(e.role, e.organization),
    fields: [
      { key: 'role', label: 'Rol', type: 'text' },
      { key: 'organization', label: 'Kuruluş', type: 'text' },
      { key: 'location', label: 'Şehir', type: 'text' },
      range,
      description,
      bullets,
    ],
  },
  {
    key: 'awards',
    label: 'Ödüller ve Başarılar',
    title: { tr: 'Ödüller ve Başarılar', en: 'Awards' },
    description: '',
    kind: 'entries',
    addLabel: 'Ödül ekle',
    summary: (e) => join(e.title, e.issuer),
    fields: [
      { key: 'title', label: 'Ödül', type: 'text', wide: true },
      { key: 'issuer', label: 'Veren', type: 'text' },
      { key: 'date', label: 'Tarih', type: 'month' },
      description,
    ],
  },
  {
    key: 'publications',
    label: 'Yayınlar',
    title: { tr: 'Yayınlar', en: 'Publications' },
    description: '',
    kind: 'entries',
    addLabel: 'Yayın ekle',
    summary: (e) => join(e.title, e.publisher),
    fields: [
      { key: 'title', label: 'Başlık', type: 'text', wide: true },
      { key: 'publisher', label: 'Yayıncı / dergi', type: 'text' },
      { key: 'date', label: 'Tarih', type: 'month' },
      { key: 'authors', label: 'Yazarlar', type: 'text', wide: true },
      { key: 'url', label: 'Bağlantı / DOI', type: 'url', wide: true },
      description,
    ],
  },
  {
    key: 'talks',
    label: 'Konferans ve Konuşmalar',
    title: { tr: 'Konferans ve Konuşmalar', en: 'Talks' },
    description: '',
    kind: 'entries',
    addLabel: 'Konuşma ekle',
    summary: (e) => join(e.title, e.event),
    fields: [
      { key: 'title', label: 'Konuşma başlığı', type: 'text', wide: true },
      { key: 'event', label: 'Etkinlik', type: 'text' },
      { key: 'location', label: 'Şehir', type: 'text' },
      { key: 'date', label: 'Tarih', type: 'month' },
      { key: 'url', label: 'Bağlantı', type: 'url' },
      description,
    ],
  },
  {
    key: 'memberships',
    label: 'Üyelikler',
    title: { tr: 'Üyelikler', en: 'Memberships' },
    description: 'Dernek, topluluk, kulüp üyelikleri.',
    kind: 'entries',
    addLabel: 'Üyelik ekle',
    summary: (e) => join(e.organization, e.role),
    fields: [
      { key: 'organization', label: 'Kuruluş', type: 'text' },
      { key: 'role', label: 'Rol', type: 'text', placeholder: 'Üye' },
      range,
    ],
  },
  {
    key: 'personal',
    label: 'Kişisel Bilgiler',
    title: { tr: 'Kişisel Bilgiler', en: 'Personal Details' },
    description: 'Doğum tarihi, askerlik, ehliyet gibi bilgiler. Hepsi isteğe bağlı.',
    kind: 'personal',
  },
  {
    key: 'hobbies',
    label: 'İlgi Alanları',
    title: { tr: 'İlgi Alanları', en: 'Interests' },
    description: '',
    kind: 'text',
  },
  {
    key: 'references',
    label: 'Referanslar',
    title: { tr: 'Referanslar', en: 'References' },
    description: 'Referans vermeden önce kişiden izin almayı unutma.',
    kind: 'references',
    addLabel: 'Referans ekle',
    summary: (e) => join(e.name, e.company),
    fields: [
      { key: 'name', label: 'Ad soyad', type: 'text' },
      { key: 'title', label: 'Unvan', type: 'text' },
      { key: 'company', label: 'Şirket', type: 'text' },
      { key: 'relation', label: 'İlişki', type: 'text', placeholder: 'Eski yöneticim' },
      { key: 'email', label: 'E-posta', type: 'text' },
      { key: 'phone', label: 'Telefon', type: 'text' },
    ],
  },
];

export const CUSTOM_FIELDS: FieldDef[] = [
  { key: 'title', label: 'Başlık', type: 'text' },
  { key: 'subtitle', label: 'Alt başlık', type: 'text' },
  { key: 'location', label: 'Yer', type: 'text' },
  { key: 'url', label: 'Bağlantı', type: 'url' },
  range,
  description,
  bullets,
];

export const SECTION_MAP = Object.fromEntries(SECTION_DEFS.map((d) => [d.key, d])) as Record<BuiltinSectionKey, SectionDef>;

export const ENTRY_SECTIONS = SECTION_DEFS.filter((d) => d.kind === 'entries').map((d) => d.key) as EntrySectionKey[];

export const STANDARD_TITLES = new Set(
  [
    'profil', 'özet', 'hakkımda', 'kariyer hedefi', 'iş deneyimi', 'deneyim', 'iş tecrübesi', 'tecrübe', 'eğitim',
    'eğitim bilgileri', 'yetenekler', 'beceriler', 'yetkinlikler', 'teknik yetenekler', 'yabancı diller', 'diller',
    'yabancı dil', 'sertifikalar', 'projeler', 'kurslar', 'kurslar ve eğitimler', 'eğitimler', 'gönüllü çalışmalar',
    'ödüller', 'ödüller ve başarılar', 'yayınlar', 'konferanslar', 'konferans ve konuşmalar', 'üyelikler',
    'kişisel bilgiler', 'ilgi alanları', 'hobiler', 'referanslar',
    'summary', 'profile', 'professional summary', 'about', 'objective', 'experience', 'work experience',
    'professional experience', 'employment history', 'education', 'skills', 'technical skills', 'languages',
    'certifications', 'certificates', 'licenses & certifications', 'projects', 'courses', 'training', 'volunteering',
    'volunteer experience', 'awards', 'honors & awards', 'publications', 'talks', 'presentations', 'memberships',
    'affiliations', 'personal details', 'personal information', 'interests', 'hobbies', 'references',
  ].map((t) => t.toLocaleLowerCase('tr-TR')),
);

export const isStandardTitle = (t: string) => STANDARD_TITLES.has(t.trim().toLocaleLowerCase('tr-TR')) || STANDARD_TITLES.has(t.trim().toLowerCase());
