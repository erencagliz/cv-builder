import { describe, expect, it } from 'vitest';
import { EN } from '../../src/i18n/en';
import { detectLang, t, translate, uiLang } from '../../src/i18n';

describe('detectLang', () => {
  it('prefers the language in the URL', () => {
    expect(detectLang('/tr/duzenle/x', 'en', ['en-US'])).toBe('tr');
    expect(detectLang('/edit/x', 'tr', ['tr-TR'])).toBe('en');
  });

  it('uses the saved preference on the root page', () => {
    expect(detectLang('/', 'tr', ['en-US'])).toBe('tr');
    expect(detectLang('/', 'en', ['tr-TR'])).toBe('en');
  });

  it('falls back to the browser language, then English', () => {
    expect(detectLang('/', null, ['de-DE', 'tr'])).toBe('tr');
    expect(detectLang('/', null, ['de-DE'])).toBe('en');
    expect(detectLang('/', null, [])).toBe('en');
    expect(detectLang('/', 'garbage', ['fr'])).toBe('en');
  });
});

describe('translate', () => {
  it('defaults to English outside the browser', () => {
    expect(uiLang()).toBe('en');
  });

  it('translates exact strings and preserves surrounding whitespace', () => {
    expect(translate('Kapat')).toBe('Close');
    expect(translate('  Kapat \n')).toBe('  Close \n');
  });

  it('fills placeholders', () => {
    expect(t('Sayfa {0}', 3)).toBe('Page 3');
  });

  it('leaves unknown and non-text strings untouched', () => {
    expect(translate('Bu metin sözlükte yok')).toBe('Bu metin sözlükte yok');
    expect(translate('123 / 456')).toBe('123 / 456');
    expect(translate('')).toBe('');
  });
});

describe('dictionary', () => {
  const entries = Object.entries(EN);

  it('has no empty translations', () => {
    expect(entries.filter(([, v]) => !v.trim()).map(([k]) => k)).toEqual([]);
  });

  it('keeps placeholders consistent between source and translation', () => {
    const ids = (s: string) => [...s.matchAll(/\{(\d+)\}/g)].map((m) => m[1]).sort().join(',');
    expect(entries.filter(([k, v]) => ids(k) !== ids(v)).map(([k]) => k)).toEqual([]);
  });

  it('does not leave Turkish characters in English values', () => {
    const allowed = /İstanbul|Ataşehir|Kadıköy|Çankaya|Türkçe|Turkish|ğ|ş|ı/;
    const suspicious = entries.filter(([, v]) => /[ğışĞİŞ]/.test(v) && !allowed.test(v)).map(([k]) => k);
    expect(suspicious).toEqual([]);
  });
});
