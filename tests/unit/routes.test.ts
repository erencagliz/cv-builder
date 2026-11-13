import { describe, expect, it } from 'vitest';
import { buildPath, canonicalPath, parsePath } from '../../src/routes';

describe('buildPath', () => {
  it('keeps English unprefixed', () => {
    expect(buildPath({ name: 'home', lang: 'en' })).toBe('/');
    expect(buildPath({ name: 'edit', lang: 'en', id: 'abc' })).toBe('/edit/abc');
    expect(buildPath({ name: 'view', lang: 'en' })).toBe('/view');
  });

  it('prefixes Turkish and localizes slugs', () => {
    expect(buildPath({ name: 'home', lang: 'tr' })).toBe('/tr/');
    expect(buildPath({ name: 'edit', lang: 'tr', id: 'abc' })).toBe('/tr/duzenle/abc');
    expect(buildPath({ name: 'view', lang: 'tr' })).toBe('/tr/goruntule');
  });

  it('falls back to the default language when none is given', () => {
    expect(buildPath({ name: 'edit', lang: null, id: 'x' })).toBe('/edit/x');
  });
});

describe('parsePath', () => {
  it.each([
    ['/', { name: 'home', lang: null }],
    ['/tr', { name: 'home', lang: 'tr' }],
    ['/tr/', { name: 'home', lang: 'tr' }],
    ['/en/', { name: 'home', lang: 'en' }],
    ['/edit/a1_B-2', { name: 'edit', lang: 'en', id: 'a1_B-2' }],
    ['/tr/duzenle/abc', { name: 'edit', lang: 'tr', id: 'abc' }],
    ['/view', { name: 'view', lang: 'en' }],
    ['/tr/goruntule', { name: 'view', lang: 'tr' }],
  ])('%s', (path, expected) => {
    expect(parsePath(path)).toEqual(expected);
  });

  it('accepts legacy unprefixed Turkish URLs', () => {
    expect(parsePath('/duzenle/abc')).toEqual({ name: 'edit', lang: 'tr', id: 'abc' });
    expect(parsePath('/goruntule')).toEqual({ name: 'view', lang: 'tr' });
  });

  it('lets an explicit prefix override the slug language', () => {
    expect(parsePath('/tr/edit/abc')).toEqual({ name: 'edit', lang: 'tr', id: 'abc' });
  });

  it('falls back to home for unknown paths and missing ids', () => {
    expect(parsePath('/nope')).toEqual({ name: 'home', lang: null });
    expect(parsePath('/edit')).toEqual({ name: 'home', lang: 'en' });
    expect(parsePath('/edit/bad id')).toEqual({ name: 'home', lang: 'en' });
  });
});

describe('canonicalPath', () => {
  it('rewrites legacy and cross-language URLs', () => {
    expect(canonicalPath('/duzenle/abc', 'tr')).toBe('/tr/duzenle/abc');
    expect(canonicalPath('/tr/duzenle/abc', 'en')).toBe('/edit/abc');
    expect(canonicalPath('/view', 'tr')).toBe('/tr/goruntule');
    expect(canonicalPath('/en/', 'en')).toBe('/');
  });

  it('is idempotent', () => {
    for (const p of ['/', '/tr/', '/edit/x', '/tr/duzenle/x', '/view', '/tr/goruntule']) {
      const lang = p.startsWith('/tr') ? 'tr' : 'en';
      expect(canonicalPath(p, lang)).toBe(p);
    }
  });
});
