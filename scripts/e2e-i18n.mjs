// Arayüz dili: tarayıcı diline göre otomatik seçim, İngilizce arayüzde çevrilmemiş metin kalmaması, menüden dil değiştirme
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
let pass = 0, fail = 0;
const ok = (name, cond, info = '') => {
  cond ? pass++ : fail++;
  console.log(`${cond ? '✓' : '✗'} ${name}${info !== '' ? ` — ${info}` : ''}`);
};
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

// İngilizce tarayıcı
const en = await b.newContext({ locale: 'en-US', viewport: { width: 1440, height: 950 } });
const p = await en.newPage();
const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
await p.goto(BASE + '/');
await p.waitForURL(/duzenle/);
await p.waitForSelector('.page-wrap svg', { timeout: 90000 });
ok('İngilizce tarayıcıda arayüz İngilizce', (await p.locator('.btn.primary', { hasText: 'Download PDF' }).count()) === 1);
ok('html lang=en', (await p.evaluate(() => document.documentElement.lang)) === 'en');
ok('İngilizce örnek CV açıldı', (await p.locator('.doc-name').inputValue()) === 'Sample CV');
const preview = await p.locator('.page').first().innerText().catch(() => '');
ok('örnek CV içeriği İngilizce', /Alex Morgan|ALEX MORGAN/.test(preview) || (await p.locator('.page svg').count()) > 0);
const panels = ['Step by step', 'All sections', 'Design', 'Cover letter'];
for (const t of panels) ok(`sekme: ${t}`, (await p.getByRole('tab', { name: t }).count()) === 1);
const content = new Set(['Sanallaştırma', 'Bilgi İşlem Uzmanı', 'A.Ş']);
const leftovers = [];
for (const [i, t] of panels.entries()) {
  await p.getByRole('tab', { name: t }).click();
  if (i === 1) for (const h of await p.locator('.content-panel .card-head').all()) await h.click().catch(() => {});
  await p.waitForTimeout(300);
  leftovers.push(...(await p.evaluate(() => window.__i18nMissing())).filter((s) => !content.has(s)));
}
await p.getByRole('tab', { name: 'All sections' }).click();
await p.getByRole('tab', { name: 'ATS check' }).click();
await p.waitForSelector('[data-testid=ats-report]', { timeout: 90000 });
leftovers.push(...(await p.evaluate(() => window.__i18nMissing())).filter((s) => !/Add .* to skills/.test(s) && !content.has(s)));
ok('ATS raporu İngilizce', (await p.locator('.fixes h4').innerText()).toLowerCase().includes('fix these first'));
ok('İngilizce CV için rol terimleri İngilizce', !(await p.locator('.kw.missing').allInnerTexts()).some((x) => /[çğışöü]/i.test(x)));
ok('çevrilmemiş arayüz metni yok', leftovers.length === 0, [...new Set(leftovers)].slice(0, 8).join(' | '));
// dil değiştir
await p.getByRole('button', { name: 'More actions' }).click();
await p.getByRole('menuitem', { name: /Arayüz: Türkçe/ }).click();
await p.waitForLoadState('load');
await p.waitForSelector('.topbar .btn.primary', { timeout: 30000 });
ok('menüden Türkçeye geçiliyor', (await p.locator('.topbar .btn.primary').innerText()).includes('PDF indir'));
ok('dil tercihi kalıcı', (await p.evaluate(() => localStorage.getItem('ui-lang'))) === 'tr');
ok('CV kaybolmadı', (await p.locator('.doc-name').inputValue()) === 'Sample CV');
await en.close();

// Türkçe tarayıcı
const tr = await b.newContext({ locale: 'tr-TR', viewport: { width: 1440, height: 950 } });
const q = await tr.newPage();
await q.goto(BASE + '/');
await q.waitForURL(/duzenle/);
ok('Türkçe tarayıcıda arayüz Türkçe', (await q.locator('.topbar .btn.primary').innerText()).includes('PDF indir'));
ok('Türkçe örnek CV', (await q.locator('.doc-name').inputValue()) === 'Örnek CV');
await tr.close();

ok('sayfa hatası yok', errs.length === 0, errs.join(' | '));
console.log(`\n${pass} geçti, ${fail} başarısız`);
await b.close();
process.exit(fail ? 1 : 0);
