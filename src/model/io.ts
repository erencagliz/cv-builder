import type { CV, Entry } from './types';
import { emptyCV, newEntry, normalizeCV, uid } from './defaults';
import { LINK_TYPES, resolveLink } from './links';

export const FILE_FORMAT = 'cv-builder';
export const FILE_VERSION = 1;

export function exportNative(cv: CV): string {
  return JSON.stringify({ format: FILE_FORMAT, version: FILE_VERSION, exportedAt: new Date().toISOString(), cv }, null, 2);
}

const s = (v: unknown) => (typeof v === 'string' ? v : '');
const ym = (v: unknown) => {
  const m = /^(\d{4})(?:-(\d{2}))?/.exec(s(v));
  return m ? (m[2] ? `${m[1]}-${m[2]}` : m[1]) : '';
};
const range = (start: unknown, end: unknown) => ({ start: ym(start), end: ym(end), current: !!s(start) && !s(end) });

/** JSON Resume (jsonresume.org) → CV */
export function fromJsonResume(j: Record<string, any>): CV {
  const cv = emptyCV('İçe aktarılan CV');
  const b = j.basics ?? {};
  const [firstName, ...rest] = s(b.name).split(' ');
  cv.personal = {
    ...cv.personal,
    firstName: firstName ?? '',
    lastName: rest.join(' '),
    title: s(b.label),
    email: s(b.email),
    phone: s(b.phone),
    location: [s(b.location?.city), s(b.location?.region)].filter(Boolean).join(', '),
  };
  cv.summary = s(b.summary);
  if (s(b.url)) cv.links.push({ id: uid(), type: 'website', value: s(b.url), label: '' });
  for (const p of b.profiles ?? []) {
    const net = s(p.network).toLowerCase().replace(/\s/g, '');
    const t = LINK_TYPES.find((x) => x.id === net || x.name.toLowerCase().replace(/\s/g, '') === net);
    cv.links.push({ id: uid(), type: t?.id ?? 'custom', value: s(p.url) || s(p.username), label: t ? '' : s(p.network) });
  }
  cv.sections.experience = (j.work ?? []).map((w: any) =>
    newEntry({
      position: s(w.position),
      company: s(w.name || w.company),
      location: s(w.location),
      dates: range(w.startDate, w.endDate),
      description: s(w.summary),
      bullets: (w.highlights ?? []).map(s),
      tags: [],
    }),
  );
  cv.sections.volunteer = (j.volunteer ?? []).map((w: any) =>
    newEntry({ role: s(w.position), organization: s(w.organization), dates: range(w.startDate, w.endDate), description: s(w.summary), bullets: (w.highlights ?? []).map(s) }),
  );
  cv.sections.education = (j.education ?? []).map((e: any) =>
    newEntry({ school: s(e.institution), field: s(e.area), degree: '', gpa: s(e.score), gpaScale: '4', dates: range(e.startDate, e.endDate), tags: (e.courses ?? []).map(s) }),
  );
  cv.sections.awards = (j.awards ?? []).map((a: any) => newEntry({ title: s(a.title), issuer: s(a.awarder), date: ym(a.date), description: s(a.summary) }));
  cv.sections.certificates = (j.certificates ?? []).map((c: any) => newEntry({ name: s(c.name), issuer: s(c.issuer), date: ym(c.date), url: s(c.url) }));
  cv.sections.publications = (j.publications ?? []).map((p: any) =>
    newEntry({ title: s(p.name), publisher: s(p.publisher), date: ym(p.releaseDate), url: s(p.url), description: s(p.summary) }),
  );
  cv.sections.skills = (j.skills ?? []).map((k: any) => newEntry({ name: s(k.name), level: '', items: (k.keywords ?? []).map(s) }));
  cv.sections.languages = (j.languages ?? []).map((l: any) => newEntry({ language: s(l.language), level: '', exam: '', score: s(l.fluency) }));
  cv.sections.projects = (j.projects ?? []).map((p: any) =>
    newEntry({ name: s(p.name), role: (p.roles ?? []).map(s).join(', '), url: s(p.url), dates: range(p.startDate, p.endDate), description: s(p.description), bullets: (p.highlights ?? []).map(s), tags: (p.keywords ?? []).map(s) }),
  );
  cv.hobbies = (j.interests ?? []).map((i: any) => s(i.name)).filter(Boolean).join(', ');
  cv.references.items = (j.references ?? []).map((r: any) => newEntry({ name: s(r.name), relation: s(r.reference) }));
  return cv;
}

/** CV → JSON Resume */
export function toJsonResume(cv: CV): object {
  const p = cv.personal;
  const date = (r: any) => r ?? {};
  const work = cv.sections.experience.map((e: Entry) => ({
    name: s(e.company),
    position: s(e.position),
    location: s(e.location),
    startDate: date(e.dates).start || undefined,
    endDate: date(e.dates).current ? undefined : date(e.dates).end || undefined,
    summary: s(e.description),
    highlights: (e.bullets as string[]) ?? [],
  }));
  return {
    $schema: 'https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json',
    basics: {
      name: `${p.firstName} ${p.lastName}`.trim(),
      label: p.title,
      email: p.email,
      phone: p.phone,
      summary: cv.summary,
      location: { city: p.location },
      profiles: cv.links.map((l) => ({ network: LINK_TYPES.find((t) => t.id === l.type)?.name ?? l.label, url: resolveLink(l.type, l.value) })),
    },
    work,
    education: cv.sections.education.map((e) => ({
      institution: s(e.school),
      area: s(e.field),
      studyType: s(e.degree),
      startDate: date(e.dates).start || undefined,
      endDate: date(e.dates).end || undefined,
      score: s(e.gpa),
      courses: (e.tags as string[]) ?? [],
    })),
    skills: cv.sections.skills.map((k) => ({ name: s(k.name), level: s(k.level), keywords: (k.items as string[]) ?? [] })),
    languages: cv.sections.languages.map((l) => ({ language: s(l.language), fluency: [s(l.level), s(l.exam), s(l.score)].filter(Boolean).join(' ') })),
    certificates: cv.sections.certificates.map((c) => ({ name: s(c.name), issuer: s(c.issuer), date: s(c.date), url: s(c.url) })),
    projects: cv.sections.projects.map((pr) => ({ name: s(pr.name), description: s(pr.description), highlights: (pr.bullets as string[]) ?? [], url: s(pr.url), keywords: (pr.tags as string[]) ?? [] })),
    awards: cv.sections.awards.map((a) => ({ title: s(a.title), awarder: s(a.issuer), date: s(a.date), summary: s(a.description) })),
    publications: cv.sections.publications.map((pu) => ({ name: s(pu.title), publisher: s(pu.publisher), releaseDate: s(pu.date), url: s(pu.url) })),
    volunteer: cv.sections.volunteer.map((v) => ({ organization: s(v.organization), position: s(v.role), summary: s(v.description), highlights: (v.bullets as string[]) ?? [] })),
    interests: cv.hobbies ? cv.hobbies.split(',').map((h) => ({ name: h.trim() })) : [],
    references: cv.references.items.map((r) => ({ name: s(r.name), reference: [s(r.title), s(r.company), s(r.email), s(r.phone)].filter(Boolean).join(', ') })),
  };
}

/** Dosya içeriğini tanıyıp CV'ye çevirir. Hata durumunda anlaşılır mesaj fırlatır. */
export function importAny(text: string): CV {
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Dosya okunamadı. Geçerli bir JSON dosyası seçtiğinden emin ol.');
  }
  let cv: CV;
  if (data?.format === FILE_FORMAT && data.cv) cv = normalizeCV(data.cv);
  else if (data?.basics || data?.work) cv = fromJsonResume(data);
  else if (data?.personal && data?.sections) cv = normalizeCV(data);
  else throw new Error('Bu dosya tanınmadı. CV Builder veya JSON Resume formatında bir dosya seç.');
  cv.id = uid();
  cv.createdAt = cv.updatedAt = Date.now();
  return cv;
}
