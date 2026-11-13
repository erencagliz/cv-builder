import { describe, expect, it } from 'vitest';
import { unicodeWords } from '../../src/ats/unicodeWord';
import { bulletHints } from '../../src/ats/writing';
import { hasMetric, scoreBullet } from '../../src/ats/report';

describe('unicodeWords', () => {
  it('matches words that start or end with non-ASCII letters', () => {
    const re = unicodeWords(/\b(çalıştım|üç|beş)\b/i);
    expect(re.test('Çalıştım')).toBe(true);
    expect(re.test('ekipte üç kişiydik')).toBe(true);
    expect(re.test('beş')).toBe(true);
  });

  it('still respects word boundaries', () => {
    const re = unicodeWords(/\b(beş)\b/i);
    expect(re.test('beşinci')).toBe(false);
    expect(re.test('kebeş')).toBe(false);
  });
});

describe('Turkish pattern regressions', () => {
  it('flags vague words at the start of a bullet', () => {
    expect(bulletHints('Çeşitli işlerden sorumluydum.', 'tr').map((h) => h.kind)).toContain('vague');
  });

  it('detects passive endings with dotless i', () => {
    expect(bulletHints('Yeni yedekleme sistemi yapıldı.', 'tr').map((h) => h.kind)).toContain('passive');
  });

  it('counts Turkish number words as metrics', () => {
    expect(hasMetric('Ekibi üç kişiye çıkardım')).toBe(true);
    expect(hasMetric('Süreyi beş gün kısalttım')).toBe(true);
  });

  it('classifies "çalıştım" as a weak verb', () => {
    expect(scoreBullet('Muhasebe biriminde çalıştım.', 'tr').verb).toBe('weak');
  });
});
