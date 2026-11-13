import { describe, expect, it } from 'vitest';
import { hasTerm, scoreBullet } from '../../src/ats/report';
import { detectRole, fold } from '../../src/ats/roles';
import { bulletHints } from '../../src/ats/writing';
import { extractKeywords, matchJob, stemTr } from '../../src/ats/keywords';
import { totalExperienceMonths } from '../../src/ats/quality';
import { buildModel } from '../../src/render/buildModel';
import { toPlainText } from '../../src/render/plainText';
import { emptyCV, newEntry } from '../../src/model/defaults';
import { sampleCV } from '../../src/model/sample';
import { contrast } from '../../src/editor/contrast';
import { fitToOnePage, scaleDesign } from '../../src/editor/fit';
import { defaultDesign } from '../../src/model/templates';

describe('bullet classification', () => {
  it.each([
    ['PowerShell betikleriyle yazılım dağıtımını otomatikleştirerek destek taleplerini %35 azalttım.', 'tr', 'strong'],
    ['3 ekip arasında sürüm takvimini koordine ettim.', 'tr', 'strong'],
    ['Yeni CRM sistemini 2 ayda hayata geçirdim.', 'tr', 'strong'],
    ['3 lokasyonda bakım işlerini yürüttüm.', 'tr', 'strong'],
    ['Sunucuların bakımından sorumluydum.', 'tr', 'weak'],
    ['Projelerde görev aldım.', 'tr', 'weak'],
    ['Yedekleme sistemi kuruldu.', 'tr', 'passive'],
    ['Envanter sistemi entegre edildi.', 'tr', 'passive'],
    ['Active Directory kullanıcı hesaplarının yönetilmesi', 'tr', 'nominal'],
    ['Müşteri şikâyetlerini her gün inceledim.', 'tr', 'active'],
    ['Reduced ticket volume by 35% by automating deployments.', 'en', 'strong'],
    ['Responsible for server maintenance.', 'en', 'weak'],
    ['Helped the team with releases.', 'en', 'weak'],
    ['Refactored the billing module.', 'en', 'active'],
  ] as const)('%s → %s', (text, lang, verb) => {
    expect(scoreBullet(text, lang).verb).toBe(verb);
  });

  it('detects metrics but ignores bare years', () => {
    expect(scoreBullet('Hataları %40 azalttım.', 'tr').metric).toBe(true);
    expect(scoreBullet('Satışları iki katına çıkardım.', 'tr').metric).toBe(true);
    expect(scoreBullet('2021 yılında yeni sisteme geçtim.', 'tr').metric).toBe(false);
  });

  it('scores strong bullets high and vague ones low', () => {
    expect(scoreBullet('PowerShell betikleriyle yazılım dağıtımını otomatikleştirerek aylık destek taleplerini %35 azalttım.', 'tr').score).toBeGreaterThanOrEqual(85);
    expect(scoreBullet('Çeşitli işlerden sorumluydum.', 'tr').score).toBeLessThanOrEqual(35);
  });
});

describe('term matching and role detection', () => {
  it('matches suffixed Turkish terms but not partial words', () => {
    expect(hasTerm(fold('Bütçesini ve stok yönetimini üstlendim'), 'Stok yönetimi')).toBe(true);
    expect(hasTerm(fold('PostgreSQL kullandım'), 'SQL')).toBe(false);
    expect(hasTerm(fold('helpdesk ekibini yönettim'), 'Help Desk')).toBe(true);
  });

  it.each([
    ['Bilgi İşlem Uzmanı', 'it-support'],
    ['Senior Frontend Developer', 'frontend'],
    ['Muhasebe Uzmanı', 'accounting'],
  ])('detects role for %s', (title, id) => {
    expect(detectRole(title)?.id).toBe(id);
  });

  it('returns null for unknown roles', () => {
    expect(detectRole('Astronot')).toBeNull();
  });

  it('stems Turkish suffixes', () => {
    expect(stemTr('yönetimini')).toBe(stemTr('yönetimi'));
  });
});

describe('writing hints', () => {
  it('flags weak, unquantified Turkish bullets', () => {
    const kinds = bulletHints('Çeşitli işlerden sorumluydum.', 'tr').map((h) => h.kind);
    expect(kinds).toEqual(expect.arrayContaining(['weak', 'number', 'vague']));
  });

  it('flags first person in English', () => {
    expect(bulletHints('I fixed 12 bugs in the payment flow last quarter.', 'en').map((h) => h.kind)).toContain('first-person');
  });

  it('stays quiet for very short input', () => {
    expect(bulletHints('ab', 'en')).toEqual([]);
  });
});

describe('job posting match', () => {
  const posting =
    'Bilgi İşlem Uzmanı arıyoruz. Active Directory, Intune, Azure, Terraform ve Kubernetes bilgisi olan, en az 3 yıl deneyimli, B sınıfı ehliyet sahibi, İngilizce bilen adaylar.';

  it('extracts dictionary and title keywords', () => {
    const keys = extractKeywords(posting).map((k) => k.term.toLowerCase());
    expect(keys).toEqual(expect.arrayContaining(['active directory', 'kubernetes']));
  });

  it('compares the posting against the CV', () => {
    const cv = sampleCV();
    const result = matchJob(posting, toPlainText(buildModel(cv)), cv);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.keywords.find((k) => k.term.toLowerCase() === 'active directory')?.found).toBe(true);
    expect(result.requirements.some((r) => /3 yıl/.test(r.text))).toBe(true);
  });

  it('warns about a missing driving licence', () => {
    const cv = emptyCV();
    const result = matchJob(posting, '', cv);
    expect(result.requirements.some((r) => r.level === 'warn' && /ehliyet/.test(r.text))).toBe(true);
  });
});

describe('experience totals', () => {
  it('merges overlapping roles', () => {
    const cv = emptyCV();
    cv.sections.experience.push(
      newEntry({ dates: { start: '2020-01', end: '2020-12', current: false } }),
      newEntry({ dates: { start: '2020-07', end: '2021-06', current: false } }),
    );
    const months = totalExperienceMonths(cv);
    expect(months).toBeGreaterThanOrEqual(17);
    expect(months).toBeLessThanOrEqual(19);
  });
});

describe('design helpers', () => {
  it('computes WCAG contrast ratios', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 0);
    expect(contrast('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
  });

  it('never scales below readability limits', () => {
    const d = scaleDesign(defaultDesign(), 0.1);
    expect(d.sizes.body).toBeGreaterThanOrEqual(8.5);
    expect(d.margins.left).toBeGreaterThanOrEqual(10);
    expect(scaleDesign(defaultDesign(), 1).sizes).toEqual(defaultDesign().sizes);
  });

  it('finds the largest factor that fits on one page', async () => {
    const cv = sampleCV();
    cv.design.sizes.body = 12;
    const base = cv.design.sizes.body;
    const pages = async (c: typeof cv) => (c.design.sizes.body > base * 0.9 ? 2 : 1);
    const fit = await fitToOnePage(cv, pages);
    expect(fit).not.toBeNull();
    expect(fit!.factor).toBeGreaterThan(0.85);
    expect(fit!.factor).toBeLessThan(0.95);
    expect(await fitToOnePage(cv, async () => 1)).toEqual({ design: cv.design, factor: 1 });
    expect(await fitToOnePage(cv, async () => 2)).toBeNull();
  });
});
