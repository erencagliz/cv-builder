import { describe, expect, it } from 'vitest';
import { displayLink, formatPhone, isCompletePhone, isValidEmail, isValidUrl, maskPhone, resolveLink } from '../../src/model/links';

describe('resolveLink', () => {
  it('expands a username using the platform pattern', () => {
    expect(resolveLink('linkedin', 'janedoe')).toBe('https://www.linkedin.com/in/janedoe');
    expect(resolveLink('github', '@octocat')).toBe('https://github.com/octocat');
  });

  it('keeps full URLs and adds a scheme to bare domains', () => {
    expect(resolveLink('linkedin', 'https://www.linkedin.com/in/x')).toBe('https://www.linkedin.com/in/x');
    expect(resolveLink('website', 'example.com')).toBe('https://example.com');
    expect(resolveLink('website', '  ')).toBe('');
  });
});

describe('displayLink', () => {
  it('strips scheme, www and trailing slash', () => {
    expect(displayLink('https://www.github.com/octocat/')).toBe('github.com/octocat');
  });
});

describe('validation', () => {
  it('validates URLs', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
    expect(isValidUrl('ftp://example.com')).toBe(false);
    expect(isValidUrl('https://localhost')).toBe(false);
    expect(isValidUrl('nope')).toBe(false);
  });

  it('validates emails', () => {
    expect(isValidEmail('a.b@example.co')).toBe(true);
    expect(isValidEmail(' a@b.io ')).toBe(true);
    expect(isValidEmail('a@b')).toBe(false);
    expect(isValidEmail('a b@c.com')).toBe(false);
  });
});

describe('phone formatting', () => {
  it.each([
    ['05423555649', '+90 (542) 355 56 49'],
    ['+90 542 355 56 49', '+90 (542) 355 56 49'],
    ['905423555649', '+90 (542) 355 56 49'],
    ['0090 542 355 5649', '+90 (542) 355 56 49'],
  ])('formats Turkish number %s', (raw, out) => {
    expect(formatPhone(raw)).toBe(out);
    expect(isCompletePhone(raw)).toBe(true);
  });

  it('masks partial input while typing', () => {
    expect(maskPhone('0542')).toBe('+90 (542)');
    expect(maskPhone('054235')).toBe('+90 (542) 35');
    expect(maskPhone('')).toBe('');
  });

  it('leaves foreign numbers alone', () => {
    expect(formatPhone('+44 7700 900123')).toBe('+44 7700 900123');
    expect(isCompletePhone('+44 7700 900123')).toBe(true);
    expect(isCompletePhone('+44 77')).toBe(false);
  });
});
