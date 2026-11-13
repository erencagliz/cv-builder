import { describe, expect, it } from 'vitest';
import fonts from '../../src/render/fonts.json';
import { TEMPLATES, applyTemplate } from '../../src/model/templates';
import { sampleCV, sampleCVEn } from '../../src/model/sample';
import { buildLetterModel, buildModel } from '../../src/render/buildModel';
import { getEngine, readPdf, renderPdf } from '../helpers/engine';

const REQUIRED = ['Çağrı Şükrü Öztürk', 'IĞDIR İSTANBUL ığşçöü', 'İŞ DENEYİMİ', 'EĞİTİM', 'linkedin.com/in/denizyilmaz', 'Group Policy', 'Askerlik Durumu: Yapıldı'];
const normalize = (s: string) => s.replace(/\s+/g, ' ');

function turkishCV(templateId: string, fontId: string) {
  const cv = sampleCV();
  cv.design = applyTemplate(cv.design, templateId);
  cv.design.headingCase = 'upper';
  cv.design.fonts = { heading: fontId, body: fontId };
  cv.personal.firstName = 'Çağrı Şükrü';
  cv.personal.lastName = 'Öztürk';
  cv.personal.location = 'IĞDIR İSTANBUL ığşçöü';
  return cv;
}

describe('PDF text layer', () => {
  const combos = TEMPLATES.flatMap((t) => (fonts as { id: string }[]).map((f) => [t.id, f.id] as const));

  it.each(combos)('%s × %s keeps Turkish characters extractable', async (templateId, fontId) => {
    const pdf = await renderPdf(turkishCV(templateId, fontId));
    const text = normalize((await readPdf(pdf)).text);
    const missing = REQUIRED.filter((m) => !text.includes(m) && !text.includes(m.toLocaleUpperCase('tr-TR')));
    expect(missing).toEqual([]);
  });

  it('renders an English CV with English headings', async () => {
    const text = normalize((await readPdf(await renderPdf(sampleCVEn()))).text);
    expect(text).toMatch(/Alex Morgan|ALEX MORGAN/);
    expect(text).toMatch(/EXPERIENCE|Experience/);
  });

  it('renders a cover letter', async () => {
    const cv = sampleCVEn();
    cv.coverLetter.company = 'Globex';
    cv.coverLetter.body = 'I am writing to apply for the role.';
    const result = await getEngine().pdf(buildLetterModel(cv), null);
    expect(result.diagnostics).toEqual([]);
    expect((await readPdf(result.pdf!)).text).toContain('I am writing to apply for the role.');
  });

  it('produces SVG previews and page counts', async () => {
    const model = buildModel(sampleCV());
    const svg = await getEngine().svg(model, null);
    expect(svg.svg).toContain('<svg');
    expect(svg.pages.length).toBeGreaterThan(0);
    expect(await getEngine().pages(model, null)).toBe(svg.pages.length);
  });
});
