import type { CV } from '../model/types';
import { emptyCV, newEntry, uid } from '../model/defaults';
import { applyTemplate } from '../model/templates';
import { PROFESSIONS, PROFESSION_MAP } from './professions';

export const fillPlaceholders = (t: string) => t.replace(/\[([^\]]+)\]/g, '$1');

const LOOKS: Record<string, { template: string; accent: string }> = {
  'it-support': { template: 'signature', accent: '#7E2A3B' },
  software: { template: 'technical', accent: '#1F4E8C' },
  accounting: { template: 'classic', accent: '#1E2A44' },
  sales: { template: 'modern', accent: '#0E6170' },
  marketing: { template: 'signature', accent: '#5B2A6E' },
  hr: { template: 'modern', accent: '#2D6A45' },
  'customer-service': { template: 'signature', accent: '#0E6170' },
  'project-manager': { template: 'executive', accent: '#1E2A44' },
  'graphic-design': { template: 'compact', accent: '#9A5B13' },
  logistics: { template: 'signature', accent: '#3A4049' },
  admin: { template: 'classic', accent: '#8A1C2B' },
  engineer: { template: 'compact', accent: '#1F4E8C' },
};

export function sampleFor(id: string): CV {
  const p = PROFESSION_MAP[id] ?? PROFESSIONS[0];
  const s = p.sample;
  const cv = emptyCV(`Örnek – ${p.name}`);
  const look = LOOKS[p.id] ?? { template: 'signature', accent: '#7E2A3B' };
  cv.design = applyTemplate(cv.design, look.template);
  cv.design.colors = { ...cv.design.colors, accent: look.accent };
  const slug = (t: string) =>
    t
      .toLocaleLowerCase('tr-TR')
      .replace(/ı/g, 'i')
      .replace(/ğ/g, 'g')
      .replace(/ş/g, 's')
      .replace(/ç/g, 'c')
      .replace(/ö/g, 'o')
      .replace(/ü/g, 'u');
  cv.personal = {
    ...cv.personal,
    firstName: s.firstName,
    lastName: s.lastName,
    title: p.title,
    email: `${slug(s.firstName)}.${slug(s.lastName)}@ornek.com`,
    phone: '+90 (500) 000 00 00',
    location: s.city,
    licenses: ['B'],
  };
  cv.links = [{ id: uid(), type: 'linkedin', value: `${slug(s.firstName)}${slug(s.lastName)}`, label: '' }];
  cv.summary = fillPlaceholders(p.summary);
  cv.sections.experience = s.jobs.map((j) =>
    newEntry({
      position: j.position,
      company: j.company,
      location: s.city.split(',').pop()!.trim(),
      employmentType: 'fulltime',
      dates: { start: j.start, end: j.end, current: !!j.current },
      bullets: j.bullets.map((i) => fillPlaceholders(p.bullets[i])),
      tags: [],
    }),
  );
  cv.sections.education = [
    newEntry({ school: s.school, degree: s.degree, field: s.field, location: '', dates: { start: s.eduStart, end: s.eduEnd, current: false }, tags: [] }),
  ];
  cv.sections.skills = p.skills.map((k) => newEntry({ name: k.name, items: [...k.items] }));
  cv.sections.languages = [newEntry({ language: 'Türkçe', level: 'native' }), newEntry({ language: 'İngilizce', level: 'B2' })];
  cv.sections.certificates = (s.certificates ?? []).map((c) => newEntry({ ...c }));
  cv.references.onRequest = true;
  return cv;
}
