import fs from 'node:fs';
import path from 'node:path';
import { EDIT_URL, expect, openEditor, test, waitForPreview } from './fixtures';

const fixture = (name: string) => path.join('tests', 'fixtures', name);

test.describe('sharing', () => {
  test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

  test('creates a link that opens in the read-only viewer', async ({ page, context }) => {
    await openEditor(page);
    await page.getByRole('button', { name: 'Share' }).click();
    const input = page.locator('.share-url');
    await expect(input).toHaveValue(/\/view#1\./);
    const url = await input.inputValue();
    await page.getByRole('button', { name: 'Copy link' }).click();
    await expect(page.locator('.toast').last()).toBeVisible();

    const viewer = await context.newPage();
    await viewer.goto(url);
    await waitForPreview(viewer);
    await expect(viewer.locator('.viewer-name')).toContainText('Alex Morgan');

    const [download] = await Promise.all([viewer.waitForEvent('download'), viewer.getByRole('button', { name: 'Download PDF' }).click()]);
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);

    await viewer.getByRole('button', { name: /Copy to my CVs/ }).click();
    await viewer.waitForURL(EDIT_URL);
  });

  test('explains a broken link', async ({ page }) => {
    await page.goto('/view#1.broken');
    await expect(page.locator('.empty-state h1')).toHaveText('Could not open the CV');
  });
});

test.describe('CV management', () => {
  test('imports an old CV from PDF and plain text', async ({ page }) => {
    await openEditor(page);
    for (const [file, name] of [
      ['sidebar.pdf', 'sidebar'],
      ['ahmet.txt', 'ahmet'],
    ]) {
      await page.getByRole('button', { name: /My CVs/ }).click();
      await page.getByRole('tab', { name: 'New CV' }).click();
      await page.locator('.new-opt', { hasText: 'Upload my old CV' }).click();
      const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.getByRole('button', { name: 'Choose file' }).click()]);
      await chooser.setFiles(fixture(file));
      await expect(page.locator('.doc-name')).toHaveValue(name);
    }
    await page.getByRole('tab', { name: 'All sections' }).click();
    await expect(page.locator('[data-sec=header] .card-meta')).toContainText('Ahmet Kaya');
  });

  test('backs up and restores without overwriting', async ({ page }, info) => {
    await openEditor(page);
    await page.getByRole('button', { name: /My CVs/ }).click();
    await page.getByRole('tab', { name: 'New CV' }).click();
    await page.locator('.new-opt', { hasText: 'Blank CV' }).click();
    await page.waitForURL(EDIT_URL);

    await page.getByRole('button', { name: /My CVs/ }).click();
    await page.getByRole('tab', { name: 'Saved' }).click();
    const items = page.locator('.cv-item');
    await expect(items).toHaveCount(2);

    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Back up all' }).click()]);
    const file = info.outputPath('backup.json');
    await download.saveAs(file);
    const backup = JSON.parse(fs.readFileSync(file, 'utf8'));
    expect(backup.format).toBe('cv-builder-backup');
    expect(backup.cvs).toHaveLength(2);

    const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.getByRole('button', { name: 'Restore backup' }).click()]);
    await chooser.setFiles(file);
    await expect(items).toHaveCount(4);
  });

  test('tracks job applications', async ({ page }) => {
    await openEditor(page);
    await page.getByRole('button', { name: /Applications/ }).first().click();
    await page.getByRole('button', { name: 'Add application' }).click();
    const drawer = page.locator('.drawer');
    await drawer.getByLabel('Position').fill('Systems Engineer');
    await drawer.getByLabel('Company').fill('Initech');
    await page.getByRole('button', { name: 'Done' }).click();
    await expect(page.locator('.app').first()).toContainText('Systems Engineer');
    await expect(page.locator('.app').first()).toContainText('Initech');
  });
});
