import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

const readJson = (file: string) => JSON.parse(fs.readFileSync(file, 'utf8'));

describe('deployment config', () => {
  it('ships valid JSON config files', () => {
    for (const file of ['vercel.json', 'public/manifest.webmanifest', 'package.json']) {
      expect(() => readJson(file), file).not.toThrow();
    }
  });

  it('routes app URLs to the right HTML shell on Vercel', () => {
    const rewrites: { source: string; destination: string }[] = readJson('vercel.json').rewrites;
    const toRegex = (source: string) => new RegExp(`^${source.replace(/\/\(\(/, '/((')}$`);
    const resolve = (path: string) => rewrites.find((r) => toRegex(r.source).test(path))?.destination ?? 'static';

    expect(resolve('/edit/abc')).toBe('/index.html');
    expect(resolve('/view')).toBe('/index.html');
    expect(resolve('/tr/duzenle/abc')).toBe('/tr/index.html');
    expect(resolve('/tr/goruntule')).toBe('/tr/index.html');
    expect(resolve('/assets/index.js')).toBe('static');
    expect(resolve('/fonts/inter/regular.ttf')).toBe('static');
    expect(resolve('/og-image.png')).toBe('static');
  });

  it('lists the Turkish fallback before the catch-all on static hosts', () => {
    const rules = fs.readFileSync('public/_redirects', 'utf8').trim().split('\n');
    expect(rules[0]).toMatch(/^\/tr\/\*\s+\/tr\/index\.html\s+200$/);
    expect(rules.at(-1)).toMatch(/^\/\*\s+\/index\.html\s+200$/);
  });
});
