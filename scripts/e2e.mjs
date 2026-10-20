import { chromium } from 'playwright';
import fs from 'fs';
const out = '/tmp/claude-0/e2e'; fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text()));
await page.goto('http://localhost:4173/');
let t = Date.now();
await page.waitForSelector('.page svg', { timeout: 60000 });
console.log('first render ms', Date.now() - t);
await page.waitForTimeout(500);
await page.screenshot({ path: `${out}/2-editor.png` });
// isim değiştir → önizleme güncellensin

await page.getByLabel('Ad', { exact: true }).fill('Eren');
await page.getByLabel('Soyad', { exact: true }).fill('Çağlı');
await page.waitForTimeout(1200);
const txt = await page.locator('.page').first().innerText().catch(() => '');
console.log('preview has name:', /Çağlı/.test(await page.locator('.page').first().innerHTML()));
// tasarım sekmesi
await page.getByRole('tab', { name: 'Tasarım' }).click();
await page.waitForTimeout(300); await page.screenshot({ path: out + '/2b-tab.png' }); await page.locator('.template').nth(1).click();
await page.getByRole('radio', { name: 'Bordo' }).click();
await page.waitForTimeout(1200);
await page.screenshot({ path: `${out}/3-design.png` });
// PDF indir
const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 60000 }), page.getByRole('button', { name: /PDF indir/ }).click()]);
await dl.saveAs(`${out}/${dl.suggestedFilename()}`);
console.log('downloaded', dl.suggestedFilename());
// undo
await page.keyboard.press('Control+z');
await page.waitForTimeout(400);
// mobil
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(600);
await page.screenshot({ path: `${out}/4-mobile.png` });
await page.getByRole('button', { name: /Önizle/ }).click();
await page.waitForTimeout(800);
await page.screenshot({ path: `${out}/5-mobile-preview.png` });
// CV'lerim paneli
await page.setViewportSize({ width: 1440, height: 900 });
await page.getByRole('button', { name: /CV’lerim/ }).click();
await page.waitForTimeout(400);
await page.screenshot({ path: `${out}/6-list.png` });
const sw = await page.evaluate(() => document.documentElement.scrollWidth);
console.log('errors', errors, 'scrollWidth', sw);
await browser.close();
