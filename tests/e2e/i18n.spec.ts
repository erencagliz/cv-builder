import { EDIT_URL, EDIT_URL_TR, expect, openEditor, test } from './fixtures';

test.describe('language and routing', () => {
  test('defaults to English with English URLs', async ({ page }) => {
    await openEditor(page);
    await expect(page).toHaveURL(EDIT_URL);
    expect(await page.evaluate(() => document.documentElement.lang)).toBe('en');
    await expect(page.locator('.topbar .btn.primary')).toHaveText(/Download PDF/);
    await expect(page.locator('.doc-name')).toHaveValue('Sample CV');
  });

  test('leaves no untranslated interface text in English', async ({ page }) => {
    await openEditor(page);
    const userContent = new Set(['Sanallaştırma', 'Bilgi İşlem Uzmanı', 'A.Ş']);
    const leftovers: string[] = [];
    const collect = async () => {
      const missing = await page.evaluate(() => (window as unknown as { __i18nMissing: () => string[] }).__i18nMissing());
      leftovers.push(...missing.filter((s) => !userContent.has(s) && !/Add .* to skills/.test(s)));
    };
    for (const tab of ['Step by step', 'All sections', 'Design', 'Cover letter']) {
      await page.getByRole('tab', { name: tab }).click();
      if (tab === 'All sections') for (const head of await page.locator('.content-panel .card-head').all()) await head.click();
      await collect();
    }
    await page.getByRole('tab', { name: 'All sections' }).click();
    await page.getByRole('tab', { name: 'ATS check' }).click();
    await expect(page.getByTestId('ats-report')).toBeVisible({ timeout: 90_000 });
    await collect();
    expect([...new Set(leftovers)]).toEqual([]);
  });

  test.describe('Turkish browser', () => {
    test.use({ locale: 'tr-TR' });

    test('redirects to Turkish URLs and interface', async ({ page }) => {
      await page.goto('/');
      await page.waitForURL(EDIT_URL_TR);
      await expect(page.locator('.topbar .btn.primary')).toHaveText(/PDF indir/);
      expect(await page.evaluate(() => document.documentElement.lang)).toBe('tr');
      await expect(page.locator('.doc-name')).toHaveValue('Örnek CV');
    });
  });

  test('switches language from the menu and keeps the CV', async ({ page }) => {
    await openEditor(page);
    const id = page.url().split('/').pop();
    await page.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('menuitem', { name: /Arayüz: Türkçe/ }).click();
    await page.waitForURL(new RegExp(`/tr/duzenle/${id}$`));
    await expect(page.locator('.topbar .btn.primary')).toHaveText(/PDF indir/);
    await expect(page.locator('.doc-name')).toHaveValue('Sample CV');
    expect(await page.evaluate(() => localStorage.getItem('ui-lang'))).toBe('tr');

    await page.goto('/');
    await page.waitForURL(EDIT_URL_TR);

    await page.getByRole('button', { name: 'Diğer işlemler' }).click();
    await page.getByRole('menuitem', { name: /Interface: English/ }).click();
    await page.waitForURL(new RegExp(`/edit/${id}$`));
    await expect(page.locator('.topbar .btn.primary')).toHaveText(/Download PDF/);
  });

  test('redirects legacy Turkish links to the localized URL', async ({ page }) => {
    await openEditor(page);
    const id = page.url().split('/').pop();
    await page.goto(`/duzenle/${id}`);
    await expect(page).toHaveURL(new RegExp(`/tr/duzenle/${id}$`));
    await expect(page.locator('.topbar .btn.primary')).toHaveText(/PDF indir/);
  });

  test('serves localized static metadata', async ({ request }) => {
    const en = await (await request.get('/')).text();
    const tr = await (await request.get('/tr/')).text();
    expect(en).toContain('<html lang="en">');
    expect(tr).toContain('<html lang="tr">');
    expect(tr).toContain('Ücretsiz, ATS uyumlu CV oluştur');
  });
});
