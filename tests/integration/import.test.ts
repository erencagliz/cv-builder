import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { applyTemplate, TEMPLATES } from '../../src/model/templates';
import { buildModel } from '../../src/render/buildModel';
import { toPlainText } from '../../src/render/plainText';
import { buildDocx } from '../../src/export/docx';
import { docxLines, headingKey, parseResume, pdfLines, takeRange, textLines } from '../../src/import/generic';
import { sampleCV } from '../../src/model/sample';
import { PROFESSIONS } from '../../src/content/professions';
import { sampleFor } from '../../src/content/gallery';
import type { CV, DateRange } from '../../src/model/types';
import { readPdf, renderPdf } from '../helpers/engine';

function accuracy(orig: CV, got: CV) {
  const checks: [string, boolean][] = [];
  const P = orig.personal;
  const G = got.personal;
  checks.push(['name', `${G.firstName} ${G.lastName}`.trim() === `${P.firstName} ${P.lastName}`.trim()]);
  checks.push(['title', G.title === P.title]);
  checks.push(['email', G.email === P.email]);
  checks.push(['phone', G.phone.replace(/\D/g, '').endsWith(P.phone.replace(/\D/g, '').slice(-10))]);
  checks.push(['linkedin', got.links.some((l) => l.type === 'linkedin') === orig.links.some((l) => l.type === 'linkedin')]);
  checks.push(['summary', !!got.summary && got.summary.slice(0, 40) === orig.summary.slice(0, 40)]);
  const oe = orig.sections.experience;
  const ge = got.sections.experience;
  checks.push(['experience count', ge.length === oe.length]);
  oe.forEach((e, i) => {
    const g = ge[i];
    checks.push([`position ${i}`, !!g && g.position === e.position]);
    checks.push([`company ${i}`, !!g && g.company === e.company]);
    checks.push([`dates ${i}`, !!g && JSON.stringify(g.dates) === JSON.stringify(e.dates)]);
    checks.push([`bullets ${i}`, !!g && (g.bullets as string[]).length === (e.bullets as string[]).length]);
  });
  checks.push(['education', got.sections.education.length === orig.sections.education.length && got.sections.education[0]?.school === orig.sections.education[0]?.school]);
  const os = orig.sections.skills.flatMap((s) => s.items as string[]);
  const gs = got.sections.skills.flatMap((s) => s.items as string[]);
  checks.push(['skills', os.filter((s) => gs.includes(s)).length >= os.length * 0.9]);
  checks.push(['languages', got.sections.languages.length === orig.sections.languages.length]);
  return { ratio: checks.filter((c) => c[1]).length / checks.length, missed: checks.filter((c) => !c[1]).map((c) => c[0]) };
}

describe('parser primitives', () => {
  it.each([
    ['Eyl 2020 – Devam ediyor', { start: '2020-09', end: '', current: true }],
    ['09/2019 - 03/2022', { start: '2019-09', end: '2022-03', current: false }],
    ['2015 – 2019', { start: '2015', end: '2019', current: false }],
    ['Jan 2021 - Present', { start: '2021-01', end: '', current: true }],
    ['Ocak 2020 - Halen', { start: '2020-01', end: '', current: true }],
  ])('parses date range "%s"', (input, expected) => {
    expect(takeRange(input).range).toEqual(expected);
  });

  it('parses dotted dates', () => {
    expect(takeRange('2018.06 – 2020.01').range?.start).toBe('2018-06');
  });

  it.each([
    ['D E N E Y İ M', 'experience'],
    ['Eğitim Bilgileri:', 'education'],
    ['WORK EXPERIENCE', 'experience'],
    ['Bilgi İşlem Uzmanı', null],
  ])('classifies heading "%s"', (input, expected) => {
    expect(headingKey(input)).toBe(expected);
  });
});

describe('round-trip import', () => {
  const results: number[] = [];

  const layouts = TEMPLATES.flatMap((t) => (['right', 'below', 'inline'] as const).map((pos) => [t.id, pos] as const));
  it.each(layouts)('reads back a PDF made with %s / dates %s', async (templateId, datePosition) => {
    const cv = sampleCV();
    cv.design = applyTemplate(cv.design, templateId);
    cv.design.datePosition = datePosition;
    const { ratio, missed } = accuracy(cv, parseResume(pdfLines(await readPdf(await renderPdf(cv)))).cv);
    results.push(ratio);
    expect(ratio, missed.join(', ')).toBeGreaterThanOrEqual(0.75);
  });

  it.each(PROFESSIONS.map((p) => [p.id]))('reads back the %s sample PDF', async (id) => {
    const cv = sampleFor(id);
    const { ratio, missed } = accuracy(cv, parseResume(pdfLines(await readPdf(await renderPdf(cv)))).cv);
    results.push(ratio);
    expect(ratio, missed.join(', ')).toBeGreaterThanOrEqual(0.75);
  });

  it.each(PROFESSIONS.slice(0, 4).map((p) => [p.id]))('reads back the %s sample as DOCX and plain text', async (id) => {
    const cv = sampleFor(id);
    const model = buildModel(cv);
    const docx = new Uint8Array(await (await buildDocx(model)).arrayBuffer());
    const fromDocx = accuracy(cv, parseResume(await docxLines(docx)).cv);
    const fromText = accuracy(cv, parseResume(textLines(toPlainText(model))).cv);
    results.push(fromDocx.ratio, fromText.ratio);
    expect(fromDocx.ratio, fromDocx.missed.join(', ')).toBeGreaterThanOrEqual(0.75);
    expect(fromText.ratio, fromText.missed.join(', ')).toBeGreaterThanOrEqual(0.75);
  });

  it('keeps average accuracy at or above 90%', () => {
    expect(results.length).toBeGreaterThan(0);
    expect(results.reduce((a, b) => a + b, 0) / results.length).toBeGreaterThanOrEqual(0.9);
  });
});

describe('hand-written CVs', () => {
  it('parses a Turkish plain-text CV', () => {
    const cv = parseResume(textLines(fs.readFileSync('tests/fixtures/ahmet.txt', 'utf8'))).cv;
    expect(cv.personal.firstName).toBe('Ahmet');
    expect(cv.personal.lastName).toBe('Kaya');
    expect(cv.sections.experience.length).toBeGreaterThan(0);
  });

  it('parses a Turkish CV with pipes, bullets and personal details', () => {
    const text = [
      'AHMET KAYA',
      'Yazılım Geliştirici',
      'ahmet.kaya@gmail.com | 0532 111 22 33 | Kadıköy, İstanbul',
      'github.com/ahmetkaya',
      '',
      'ÖZET',
      '5 yıllık backend deneyimine sahip yazılım geliştiriciyim. Java ve Spring Boot ile ölçeklenebilir servisler geliştiriyorum.',
      '',
      'İŞ DENEYİMİ',
      'Kıdemli Yazılım Geliştirici | Trendyol | 03/2021 - Halen',
      '- Sipariş servisini mikroservislere taşıdım; yanıt süresini %40 düşürdüm.',
      '- 4 kişilik ekibe mentorluk yaptım.',
      'Yazılım Geliştirici | Logo Yazılım | 06/2018 - 02/2021',
      '- ERP entegrasyonları geliştirdim.',
      '',
      'EĞİTİM',
      'İstanbul Teknik Üniversitesi',
      'Bilgisayar Mühendisliği, Lisans',
      '2014 - 2018',
      '',
      'YETENEKLER',
      'Diller: Java, Kotlin, SQL',
      'Araçlar: Docker, Kubernetes, Git',
      '',
      'YABANCI DİLLER',
      'İngilizce - İleri (C1)',
      'Almanca - Başlangıç',
      '',
      'KİŞİSEL BİLGİLER',
      'Doğum Tarihi: 12.04.1996',
      'Askerlik Durumu: Yapıldı',
      'Ehliyet: B',
    ].join('\n');
    const cv = parseResume(textLines(text)).cv;
    const exp = cv.sections.experience;
    expect([cv.personal.firstName, cv.personal.lastName]).toEqual(['Ahmet', 'Kaya']);
    expect(cv.personal.title).toBe('Yazılım Geliştirici');
    expect(cv.personal.phone.replace(/\D/g, '')).toMatch(/5321112233$/);
    expect(cv.personal.location).toMatch(/Kadıköy, İstanbul/i);
    expect(exp.map((e) => [e.position, e.company])).toEqual([
      ['Kıdemli Yazılım Geliştirici', 'Trendyol'],
      ['Yazılım Geliştirici', 'Logo Yazılım'],
    ]);
    expect((exp[0].dates as DateRange).current).toBe(true);
    expect((exp[1].dates as DateRange).end).toBe('2021-02');
    expect(exp[0].bullets).toHaveLength(2);
    expect(cv.sections.education[0]).toMatchObject({ school: 'İstanbul Teknik Üniversitesi', degree: 'bachelor', field: 'Bilgisayar Mühendisliği' });
    expect(cv.sections.skills).toHaveLength(2);
    expect(cv.sections.skills[1].items).toContain('Kubernetes');
    expect(cv.sections.languages).toHaveLength(2);
    expect(cv.sections.languages[0].level).toBe('C1');
    expect(cv.personal.birthDate).toBe('1996-04-12');
    expect(cv.personal.military).toBe('done');
    expect(cv.personal.licenses).toEqual(['B']);
  });

  it('parses an English CV with stacked entries', () => {
    const text = [
      'Jane Doe',
      'Data Analyst',
      'jane.doe@example.com · +44 7700 900123 · London',
      'linkedin.com/in/janedoe',
      '',
      'Professional Summary',
      'Data analyst with 4 years of experience turning messy data into decisions.',
      '',
      'Experience',
      'Data Analyst',
      'Acme Corp, London',
      'Jan 2022 – Present',
      '• Built 12 Power BI dashboards used by 300 staff.',
      '• Cut reporting time by 50% with automated SQL pipelines.',
      'Junior Analyst',
      'Globex Ltd',
      'Jun 2020 – Dec 2021',
      '• Cleaned and analysed sales data.',
      '',
      'Education',
      'University of Manchester',
      'BSc Mathematics',
      '2016 – 2019',
      '',
      'Skills',
      'SQL, Python, Power BI, Excel, Tableau',
      '',
      'Languages',
      'English (Native), Spanish (Intermediate)',
    ].join('\n');
    const cv = parseResume(textLines(text)).cv;
    expect(cv.lang).toBe('en');
    expect([cv.personal.firstName, cv.personal.lastName]).toEqual(['Jane', 'Doe']);
    expect(cv.sections.experience.map((e) => e.company)).toEqual(['Acme Corp', 'Globex Ltd']);
    expect(cv.sections.education[0]).toMatchObject({ school: 'University of Manchester', degree: 'bachelor' });
    expect(cv.sections.skills[0].items).toHaveLength(5);
    expect(cv.sections.languages.map((l) => l.level)).toEqual(['native', 'B1']);
  });

  it('parses a two-column PDF with a sidebar', async () => {
    const pdf = await readPdf(new Uint8Array(fs.readFileSync('tests/fixtures/sidebar.pdf')));
    const cv = parseResume(pdfLines(pdf)).cv;
    expect(cv.personal.firstName).toBe('Selin');
    expect(cv.personal.title).toBe('UI/UX Tasarımcı');
    expect(cv.personal.email).toBe('selin.demir@mail.com');
    expect(cv.personal.location).toBe('Çankaya, Ankara');
    expect(cv.links).toHaveLength(1);
    expect(cv.sections.experience).toHaveLength(2);
    expect(cv.sections.experience[1].company).toBe('Bulut Yazılım A.Ş.');
    expect(cv.sections.experience[0].bullets).toHaveLength(2);
    expect(cv.sections.education[0]).toMatchObject({ school: 'Hacettepe Üniversitesi', field: 'Grafik Tasarım' });
    expect(cv.sections.skills[0].items).toHaveLength(6);
    expect(cv.sections.languages).toHaveLength(2);
  });
});
