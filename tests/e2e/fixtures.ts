import { test as base, expect, type Page } from '@playwright/test';

export const EDIT_URL = /\/edit\/[\w-]+$/;
export const EDIT_URL_TR = /\/tr\/duzenle\/[\w-]+$/;

export async function waitForPreview(page: Page) {
  await expect(page.locator('.page-wrap svg').first()).toBeVisible({ timeout: 90_000 });
}

export async function openEditor(page: Page, path = '/') {
  await page.goto(path);
  await page.waitForURL(path.startsWith('/tr') ? EDIT_URL_TR : EDIT_URL);
  await waitForPreview(page);
}

export const test = base.extend<{ pageErrors: string[] }>({
  pageErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await use(errors);
      expect(errors, 'uncaught page errors').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
