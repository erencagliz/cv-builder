import { describe, expect, it, vi } from 'vitest';
import { decodeCV, encodeCV, shareUrl } from '../../src/share/link';
import { sampleCV, sampleCVEn } from '../../src/model/sample';
import { emptyCV } from '../../src/model/defaults';
import { PROFESSIONS } from '../../src/content/professions';
import { sampleFor } from '../../src/content/gallery';
import type { CV } from '../../src/model/types';

const comparable = (cv: CV) => JSON.parse(JSON.stringify(cv, (k, v) => (k === 'id' || k === 'createdAt' || k === 'updatedAt' ? undefined : v)));

function prepare(cv: CV): CV {
  cv.jobPosting = '';
  cv.coverLetter = emptyCV().coverLetter;
  cv.personal.photo = '';
  cv.personal.showPhoto = false;
  return cv;
}

describe('share links', () => {
  const cases: [string, CV][] = [
    ['sample (tr)', sampleCV()],
    ['sample (en)', sampleCVEn()],
    ['empty', emptyCV()],
    ...PROFESSIONS.map((p) => [p.id, sampleFor(p.id)] as [string, CV]),
  ];

  it.each(cases)('round-trips %s', async (_name, cv) => {
    prepare(cv);
    cv.design.colors.accent = '#123456';
    cv.design.sizes.body = 10.25;
    const code = await encodeCV(cv);
    expect(code).toMatch(/^1\.[\w-]+$/);
    expect(comparable(await decodeCV(code))).toEqual(comparable(cv));
  });

  it('strips private data unless asked to keep the photo', async () => {
    const cv = sampleCV();
    cv.jobPosting = 'secret posting';
    cv.personal.photo = 'data:image/png;base64,AAAA';
    cv.personal.showPhoto = true;
    const out = await decodeCV(await encodeCV(cv));
    expect(out.jobPosting).toBe('');
    expect(out.personal.photo).toBe('');
    const withPhoto = await decodeCV(await encodeCV(cv, { photo: true }));
    expect(withPhoto.personal.photo).toBe(cv.personal.photo);
  });

  it('rejects corrupted or unknown codes', async () => {
    await expect(decodeCV('1.not-valid')).rejects.toThrow();
    await expect(decodeCV('9.abc')).rejects.toThrow();
    await expect(decodeCV('garbage')).rejects.toThrow();
  });

  it('builds a localized viewer URL', () => {
    vi.stubGlobal('location', { origin: 'https://cv.example' });
    expect(shareUrl('1.abc', 'en')).toBe('https://cv.example/view#1.abc');
    expect(shareUrl('1.abc', 'tr')).toBe('https://cv.example/tr/goruntule#1.abc');
    vi.unstubAllGlobals();
  });
});
