import fs from 'node:fs';
import { expect, openEditor, test } from './fixtures';

test.describe('editor', () => {
  test('updates the preview and exports a PDF with the edited name', async ({ page }) => {
    await openEditor(page);
    await page.getByLabel('First name', { exact: true }).fill('Grace');
    await page.getByLabel('Last name', { exact: true }).fill('Hopper');
    await expect(page.locator('.topbar')).toContainText(/Saved/, { timeout: 15_000 });

    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Download PDF/ }).click()]);
    expect(download.suggestedFilename()).toBe('Grace-Hopper-Resume.pdf');
    const bytes = fs.readFileSync(await download.path());
    expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
  });

  test('persists edits across reloads', async ({ page }) => {
    await openEditor(page);
    await page.locator('.doc-name').fill('Persisted CV');
    await page.locator('.doc-name').blur();
    await expect(page.locator('.topbar')).toContainText(/Saved/, { timeout: 15_000 });
    await page.reload();
    await expect(page.locator('.doc-name')).toHaveValue('Persisted CV');
  });

  test('undo restores the previous value', async ({ page }) => {
    await openEditor(page);
    const name = page.locator('.doc-name');
    const original = await name.inputValue();
    await name.fill('Temporary');
    await name.blur();
    await page.getByRole('button', { name: /^Undo/ }).click();
    await expect(name).toHaveValue(original);
  });

  test('switches templates from the design panel', async ({ page }) => {
    await openEditor(page);
    await page.getByRole('tab', { name: 'Design' }).click();
    const templates = page.locator('.template');
    expect(await templates.count()).toBeGreaterThan(1);
    await templates.nth(2).click();
    await expect(templates.nth(2)).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.template[aria-pressed=true]')).toHaveCount(1);
  });

  test('exports Word documents', async ({ page }) => {
    await openEditor(page);
    await page.getByRole('button', { name: 'More actions' }).click();
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('menuitem', { name: /Download as Word/ }).click()]);
    expect(download.suggestedFilename()).toMatch(/\.docx$/);
    const bytes = fs.readFileSync(await download.path());
    expect(bytes.subarray(0, 2).toString()).toBe('PK');
  });

  test('runs the ATS check and job match', async ({ page }) => {
    await openEditor(page);
    await page.getByRole('tab', { name: 'ATS check' }).click();
    await expect(page.getByTestId('ats-report')).toBeVisible({ timeout: 90_000 });
    const score = Number(await page.locator('.score-num strong').first().innerText());
    expect(score).toBeGreaterThanOrEqual(80);

    await page.getByRole('tab', { name: 'Job match' }).click();
    await page.locator('#job-ad').fill('IT Support Specialist\nWe need Active Directory, Intune, Kubernetes and Terraform experience, at least 3 years.');
    await expect(page.locator('.kw.found').first()).toBeVisible();
    const missingBefore = await page.locator('.kw.missing').count();
    expect(missingBefore).toBeGreaterThan(0);
    await page.locator('.kw.missing button').first().click();
    await expect(page.locator('.kw.missing')).toHaveCount(missingBefore - 1);
  });

  test('recovers from corrupted stored data without a blank screen', async ({ page }) => {
    await openEditor(page);
    await page.evaluate(async () => {
      const req = indexedDB.open('cv-builder');
      await new Promise((r) => (req.onsuccess = r));
      const tx = req.result.transaction('cvs', 'readwrite');
      tx.objectStore('cvs').put({ id: 'broken1', name: 'broken', updatedAt: Date.now() + 1e9, data: { id: 'broken1', personal: null, sections: 5, design: 'x' } });
      await new Promise((r) => (tx.oncomplete = r));
    });
    await page.goto('/edit/broken1');
    await expect(page.locator('.crash, .editor').first()).toBeVisible();
  });
});
