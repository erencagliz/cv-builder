import { describe, expect, it } from 'vitest';
import { buildReport } from '../../src/ats/report';
import { buildModel } from '../../src/render/buildModel';
import { toPlainText } from '../../src/render/plainText';
import { sampleCV, sampleCVEn } from '../../src/model/sample';
import { emptyCV, newEntry } from '../../src/model/defaults';
import { PROFESSIONS } from '../../src/content/professions';
import { sampleFor } from '../../src/content/gallery';
import type { CV } from '../../src/model/types';
import { readPdf, renderPdf } from '../helpers/engine';

async function report(cv: CV) {
  const model = buildModel(cv);
  const pdf = await readPdf(await renderPdf(cv));
  return buildReport({ cv, model, text: pdf.text, pages: pdf.pages, plainText: toPlainText(model) });
}

const finding = (r: Awaited<ReturnType<typeof report>>, id: string) => r.findings.find((f) => f.id === id);

describe('ATS report', () => {
  it('scores the Turkish sample highly and parses every field', async () => {
    const r = await report(sampleCV());
    expect(r.score).toBeGreaterThanOrEqual(80);
    for (const f of r.findings.filter((x) => x.cat === 'parse')) expect(f.level, f.title).toBe('ok');
  });

  it('scores the English sample highly with English role terms', async () => {
    const r = await report(sampleCVEn());
    expect(r.score).toBeGreaterThanOrEqual(85);
    expect(finding(r, 'p-std')?.level).toBe('ok');
    expect((finding(r, 'k-role')?.items ?? []).some((i) => /[çğışöü]/i.test(i.text))).toBe(false);
  });

  it.each(PROFESSIONS.map((p) => [p.id]))('scores the %s sample without parse errors', async (id) => {
    const r = await report(sampleFor(id));
    expect(r.score).toBeGreaterThanOrEqual(70);
    expect(r.findings.filter((f) => f.cat === 'parse' && f.level === 'error').map((f) => f.title)).toEqual([]);
  });

  it('penalizes a weak CV with specific findings', async () => {
    const cv = emptyCV('Weak');
    cv.personal.firstName = 'Ali';
    cv.personal.lastName = 'Veli';
    cv.personal.email = 'kral1903@hotmail.com';
    cv.sections.experience.push(
      newEntry({ position: 'Uzman', company: 'X', dates: { start: '2019-01', end: '2020-01', current: false }, bullets: ['Çeşitli işlerden sorumluydum.', 'Raporlar hazırlandı.'] }),
      newEntry({ position: 'Uzman', company: 'Y', dates: { start: '2021-01', end: '', current: true }, bullets: ['Takım oyuncusu olarak projelerde görev aldım.'] }),
    );
    cv.sections.skills.push(newEntry({ name: 'Beceriler', items: ['İletişim', 'Takım çalışması', 'Liderlik', 'Excel'] }));
    cv.summary = 'Çalışkan, dinamik ve sonuç odaklı biriyim.';
    const r = await report(cv);
    expect(r.score).toBeLessThan(60);
    expect(finding(r, 'l-chrono')?.level).toBe('warn');
    expect(finding(r, 'i-cliche')?.level).toBe('warn');
    expect(finding(r, 'c-email')?.level).toBe('warn');
    expect(finding(r, 'k-soft')).toBeDefined();
    expect(finding(r, 'i-verbs')?.level).toBe('warn');
  });

  it('caps the score when the email is missing', async () => {
    const cv = sampleCV();
    cv.personal.email = '';
    const r = await report(cv);
    expect(r.capped).toBe(true);
    expect(r.score).toBeLessThanOrEqual(49);
  });

  it('flags non-standard headings and button-style links', async () => {
    const odd = sampleCV();
    odd.titles.experience = 'Kariyer Yolculuğum';
    expect(finding(await report(odd), 'p-std')?.level).toBe('warn');

    const buttons = sampleCV();
    buttons.design.linkStyle = 'button';
    expect(finding(await report(buttons), 'p-links')?.level).toBe('warn');
  });

  it('adds a job match finding when a posting is present', async () => {
    const cv = sampleCV();
    cv.jobPosting = 'Bilgi İşlem Uzmanı arıyoruz. Active Directory, Intune, Azure, Terraform ve Kubernetes bilgisi olan, en az 3 yıl deneyimli adaylar.';
    expect(finding(await report(cv), 'k-job')).toBeDefined();
  });
});
