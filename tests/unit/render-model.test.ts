import { describe, expect, it } from 'vitest';
import { buildLetterModel, buildModel, fileName, formatMonth, formatRange, parseRich, sectionTitle, upperTr } from '../../src/render/buildModel';
import { toPlainText } from '../../src/render/plainText';
import { sampleCV, sampleCVEn } from '../../src/model/sample';
import { emptyCV } from '../../src/model/defaults';

describe('date formatting', () => {
  it('formats months in every supported style', () => {
    expect(formatMonth('2021-03', 'MMM YYYY', 'en')).toBe('Mar 2021');
    expect(formatMonth('2021-03', 'MMMM YYYY', 'tr')).toBe('Mart 2021');
    expect(formatMonth('2021-03', 'MM/YYYY', 'en')).toBe('03/2021');
    expect(formatMonth('2021-03', 'YYYY-MM', 'en')).toBe('2021-03');
    expect(formatMonth('2021-03', 'YYYY', 'en')).toBe('2021');
    expect(formatMonth('2021', 'MMM YYYY', 'en')).toBe('2021');
    expect(formatMonth('', 'MMM YYYY', 'en')).toBe('');
  });

  it('formats ranges including ongoing roles', () => {
    expect(formatRange({ start: '2020-01', end: '2022-06', current: false }, 'MM/YYYY', 'en')).toBe('01/2020 – 06/2022');
    expect(formatRange({ start: '2020-01', end: '', current: true }, 'YYYY', 'en')).toMatch(/^2020 – \S+/);
    expect(formatRange({ start: '2020', end: '2020', current: false }, 'YYYY', 'en')).toBe('2020');
    expect(formatRange(null, 'YYYY', 'en')).toBe('');
  });
});

describe('text helpers', () => {
  it('upper-cases with locale rules', () => {
    expect(upperTr('eğitim', 'tr')).toBe('EĞİTİM');
    expect(upperTr('education', 'en')).toBe('EDUCATION');
  });

  it('parses bold and italic markup', () => {
    expect(parseRich('a **b** *c* d')).toEqual([{ t: 'a ' }, { t: 'b', b: true }, { t: ' ' }, { t: 'c', i: true }, { t: ' d' }]);
    expect(parseRich('plain')).toEqual([{ t: 'plain' }]);
  });

  it('builds ASCII-safe file names', () => {
    const cv = emptyCV();
    cv.personal.firstName = 'Çağrı Şükrü';
    cv.personal.lastName = 'Öztürk';
    expect(fileName(cv, 'pdf')).toBe('Cagri-Sukru-Ozturk-CV.pdf');
    cv.lang = 'en';
    cv.personal.firstName = cv.personal.lastName = '';
    expect(fileName(cv, 'docx')).toBe('CV-Resume.docx');
  });
});

describe('render model', () => {
  it('uses custom section titles when set', () => {
    const cv = sampleCV();
    cv.titles.experience = '  Career  ';
    expect(sectionTitle(cv, 'experience')).toBe('Career');
  });

  it('omits hidden and empty sections', () => {
    const cv = sampleCV();
    cv.hidden = ['skills'];
    const titles = buildModel(cv).sections.map((s) => s.title);
    expect(titles).not.toContain(sectionTitle(cv, 'skills'));
    expect(buildModel(emptyCV()).sections).toEqual([]);
  });

  it('produces plain text with the contact line and headings', () => {
    const text = toPlainText(buildModel(sampleCVEn()));
    expect(text).toContain('Alex Morgan');
    expect(text).toContain('alex.morgan@example.com');
    expect(text).toMatch(/\n(WORK )?EXPERIENCE/);
  });

  it('builds a cover letter model', () => {
    const cv = sampleCVEn();
    cv.coverLetter.body = 'Hello there.';
    expect(buildLetterModel(cv).letter).toBeTruthy();
  });
});
