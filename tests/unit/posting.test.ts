import { describe, expect, it } from 'vitest';
import { guessFromPosting } from '../../src/ats/posting';

describe('guessFromPosting', () => {
  it('finds position and company by legal suffix', () => {
    expect(guessFromPosting('Bilgi İşlem Uzmanı\nAnka Teknoloji A.Ş.\nActive Directory deneyimi olan adaylar arıyoruz.')).toEqual({
      position: 'Bilgi İşlem Uzmanı',
      company: 'Anka Teknoloji A.Ş.',
    });
  });

  it('recognizes a company that only ends with a Turkish suffix', () => {
    expect(guessFromPosting('Muhasebe Uzmanı\nYıldız Gıda A.Ş.').company).toBe('Yıldız Gıda A.Ş.');
  });

  it('prefers an explicit company label', () => {
    expect(guessFromPosting('Position: Data Analyst\nCompany: Globex\nWe are hiring.')).toEqual({ position: 'Data Analyst', company: 'Globex' });
  });

  it('returns empty values for empty input', () => {
    expect(guessFromPosting('')).toEqual({ position: '', company: '' });
  });
});
