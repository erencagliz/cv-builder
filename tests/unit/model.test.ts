import { describe, expect, it } from 'vitest';
import { DEFAULT_ORDER, emptyCV, normalizeCV } from '../../src/model/defaults';
import { exportNative, fromJsonResume, importAny, toJsonResume } from '../../src/model/io';
import { sampleCV, sampleCVEn } from '../../src/model/sample';
import { TEMPLATES, applyTemplate, defaultDesign } from '../../src/model/templates';
import { SECTION_DEFS, isStandardTitle } from '../../src/model/sections';
import { PROFESSIONS } from '../../src/content/professions';
import { sampleFor } from '../../src/content/gallery';

describe('normalizeCV', () => {
  it('returns a complete empty CV for garbage input', () => {
    for (const input of [null, undefined, 42, 'x', []]) {
      const cv = normalizeCV(input);
      expect(cv.order).toEqual(DEFAULT_ORDER);
      expect(cv.sections.experience).toEqual([]);
    }
  });

  it('fills in missing nested fields and ids', () => {
    const cv = normalizeCV({ personal: { firstName: 'Ada' }, sections: { experience: [{ position: 'Engineer' }] }, design: { colors: { accent: '#000000' } } });
    expect(cv.personal.firstName).toBe('Ada');
    expect(cv.personal.lastName).toBe('');
    expect(cv.sections.experience[0].id).toMatch(/\S+/);
    expect(cv.design.colors.accent).toBe('#000000');
    expect(cv.design.colors.text).toBe(defaultDesign().colors.text);
  });

  it('drops unknown section keys and appends missing ones to the order', () => {
    const cv = normalizeCV({ order: ['skills', 'bogus', 'summary'] });
    expect(cv.order.slice(0, 2)).toEqual(['skills', 'summary']);
    expect(cv.order).not.toContain('bogus');
    expect(new Set(cv.order)).toEqual(new Set(DEFAULT_ORDER));
  });

  it('keeps custom sections in the order', () => {
    const cv = normalizeCV({ custom: [{ id: 'c1', title: 'Patents', items: [{ title: 'X' }] }] });
    expect(cv.order).toContain('custom:c1');
    expect(cv.custom[0].items[0].id).toBeTruthy();
  });

  it('is stable for already-normalized data', () => {
    const cv = sampleCV();
    expect(normalizeCV(structuredClone(cv))).toEqual(cv);
  });
});

describe('file import/export', () => {
  it('round-trips the native format with a fresh id', () => {
    const cv = sampleCV();
    const back = importAny(exportNative(cv));
    expect(back.id).not.toBe(cv.id);
    expect(back.personal).toEqual(cv.personal);
    expect(back.sections).toEqual(cv.sections);
  });

  it('accepts a bare CV object', () => {
    expect(importAny(JSON.stringify(sampleCVEn())).personal.firstName).toBe('Alex');
  });

  it('round-trips JSON Resume', () => {
    const cv = sampleCVEn();
    const json = toJsonResume(cv) as { basics: { name: string; email: string } };
    expect(json.basics.name).toBe('Alex Morgan');
    expect(json.basics.email).toBe(cv.personal.email);
    const back = fromJsonResume(json);
    expect(back.personal.firstName).toBe('Alex');
    expect(back.personal.lastName).toBe('Morgan');
    expect(back.sections.experience.length).toBe(cv.sections.experience.length);
    expect(back.sections.experience[0].position).toBe(cv.sections.experience[0].position);
  });

  it('rejects malformed or unrecognized files with a readable error', () => {
    expect(() => importAny('{not json')).toThrow(/JSON/);
    expect(() => importAny('{"hello":1}')).toThrow();
  });
});

describe('templates and sections', () => {
  it('applies every template', () => {
    for (const t of TEMPLATES) {
      const design = applyTemplate(defaultDesign(), t.id);
      expect(design.sizes.body, t.id).toBeGreaterThan(0);
      expect(design.fonts.body, t.id).toBeTruthy();
    }
  });

  it('has unique template and section ids', () => {
    expect(new Set(TEMPLATES.map((t) => t.id)).size).toBe(TEMPLATES.length);
    expect(new Set(SECTION_DEFS.map((s) => s.key)).size).toBe(SECTION_DEFS.length);
  });

  it('recognizes standard headings in both languages', () => {
    expect(isStandardTitle('İş Deneyimi')).toBe(true);
    expect(isStandardTitle('Work Experience')).toBe(true);
    expect(isStandardTitle('My Journey')).toBe(false);
  });
});

describe('sample content', () => {
  it('builds a sample CV for every profession', () => {
    for (const p of PROFESSIONS) {
      const cv = sampleFor(p.id);
      expect(cv.personal.firstName, p.id).toBeTruthy();
      expect(cv.sections.experience.length, p.id).toBeGreaterThan(0);
    }
  });

  it('creates empty CVs with unique ids', () => {
    expect(emptyCV().id).not.toBe(emptyCV().id);
  });
});
