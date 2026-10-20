// Arayüzün tüm ekranlarını gezer. MODE=harvest: tüm metinleri toplar. MODE=check (varsayılan): İngilizce arayüzde çevrilmemiş Türkçe metinleri listeler.
import { chromium } from 'playwright';
import fs from 'fs';
const BASE = process.env.BASE || 'http://localhost:4173';
const MODE = process.env.MODE || 'check';
const found = new Map();
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport: { width: 1440, height: 950 }, permissions: ['clipboard-read', 'clipboard-write'] });
await ctx.addInitScript(() => localStorage.setItem('ui-lang', 'en'));
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
const grab = async (where) => {
  await p.waitForTimeout(250);
  const list = await p.evaluate((mode) => {
    if (mode === 'check') return window.__i18nMissing();
    const SKIP = '.page, .ats-text, .bl-text, .it-text, .g-svg, .qr, [data-no-i18n], textarea, script, style';
    const out = new Set();
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let x = w.nextNode(); x; x = w.nextNode()) {
      const el = x.parentElement;
      if (!el || el.closest(SKIP)) continue;
      const v = (x.nodeValue || '').trim();
      if (v && /\p{L}{2}/u.test(v)) out.add(v);
    }
    document.querySelectorAll('[title],[placeholder],[aria-label]').forEach((el) => {
      if (el.closest(SKIP) && !el.matches('textarea')) return;
      for (const a of ['title', 'placeholder', 'aria-label']) {
        const v = el.getAttribute(a)?.trim();
        if (v && /\p{L}{2}/u.test(v)) out.add(v);
      }
    });
    return [...out];
  }, MODE);
  for (const s of list) if (!found.has(s)) found.set(s, where);
};
const click = async (loc) => {
  try {
    await loc.first().click({ timeout: 3000 });
    return true;
  } catch {
    return false;
  }
};
// Not: İngilizce arayüzde düğme adları çevrilmiş olabilir; seçicilerde sınıf ve konum kullanılır.
await p.goto(BASE + '/');
await p.waitForURL(/duzenle/);
await p.waitForSelector('.page-wrap svg', { timeout: 90000 });
await grab('editor');
// sihirbaz adımları
const steps = p.locator('.wizard-steps button, .steps button');
const ns = await steps.count();
for (let i = 0; i < ns; i++) {
  await click(steps.nth(i));
  await grab(`wizard ${i}`);
}
// tüm bölümler: kartları ve ilk girdileri aç
const tabs = p.locator('.panel .tabs [role=tab]');
await click(tabs.nth(1));
const heads = p.locator('.content-panel .card-head');
for (let i = 0; i < (await heads.count()); i++) {
  const sec = heads.nth(i).locator('xpath=ancestor::section[1]');
  if (!((await sec.getAttribute('class')) || '').includes('open')) await click(heads.nth(i));
}
const toggles = p.locator('.entry-toggle');
for (let i = 0; i < Math.min(await toggles.count(), 30); i++) {
  await click(toggles.nth(i));
  await grab(`entry ${i}`);
}
await grab('content');
// geçersiz e-posta uyarısı
const email = p.locator('[data-sec=header] input[type=email], [data-sec=header] input[autocomplete=email]');
if (await email.count()) {
  const old = await email.first().inputValue();
  await email.first().fill('yanlis@');
  await email.first().blur();
  await grab('email error');
  await email.first().fill(old);
}
// ikon seçici
if (await click(p.locator('.icon-picker-btn, .ip-trigger, [aria-label*="ikon"]'))) {
  await grab('icon picker');
  await p.keyboard.press('Escape');
}
// örnek maddeler
if (await click(p.locator('.bullet-tools button').nth(1))) {
  await grab('examples');
  await p.keyboard.press('Escape');
}
// tasarım
await click(tabs.nth(2));
await grab('design');
for (const sel of ['.design-panel details summary', '.design-panel .section-toggle']) {
  const s = p.locator(sel);
  for (let i = 0; i < (await s.count()); i++) await click(s.nth(i));
}
await grab('design open');
// ön yazı
await click(tabs.nth(3));
await grab('letter');
const starter = p.locator('.starter');
if (await starter.count()) {
  await click(starter.first());
  await grab('letter filled');
}
await click(tabs.nth(1));
// görünümler
const views = p.locator('.view-tabs [role=tab]');
await click(views.nth(1));
await p.waitForSelector('[data-testid=ats-report]', { timeout: 90000 });
await grab('ats');
await p.locator('details.passed').evaluateAll((ds) => ds.forEach((d) => (d.open = true)));
await p.locator('.link-btn').evaluateAll((bs) => bs.forEach((x) => x.click()));
await grab('ats open');
const sub = p.locator('.sub-tabs [role=tab]');
await click(sub.nth(1));
await grab('ats bullets');
await click(sub.nth(2));
await grab('ats text');
await click(views.nth(2));
await grab('job empty');
await p.locator('#job-ad').fill('Bilgi İşlem Uzmanı\nAnka A.Ş.\nActive Directory, Intune, Azure, Terraform bilen; en az 3 yıl deneyimli; B sınıfı ehliyet; askerlik görevini tamamlamış.');
await p.waitForTimeout(400);
await grab('job');
await click(views.nth(0));
// menü
await click(p.locator('[aria-expanded][aria-label]').filter({ has: p.locator('svg') }).nth(0));
await click(p.locator('.topbar .icon-btn[aria-expanded]'));
await grab('menu');
await p.keyboard.press('Escape');
await click(p.locator('.menu-backdrop'));
// sürüm geçmişi + gizlilik
await click(p.locator('.topbar .icon-btn[aria-expanded]'));
await click(p.locator('.menu [role=menuitem]').filter({ has: p.locator('svg path[d^="M3 12a9"]') }));
await grab('history');
await p.keyboard.press('Escape');
await click(p.locator('.modal-back'));
await click(p.locator('.privacy-badge, .badge-privacy, .topbar .pill'));
await grab('privacy');
await click(p.locator('.modal .icon-btn'));
// çekmeceler
await click(p.locator('.cvs-btn').first());
const dt = p.locator('.drawer-tabs [role=tab]');
for (let i = 0; i < (await dt.count()); i++) {
  await click(dt.nth(i));
  await grab(`cvs tab ${i}`);
}
await click(dt.nth(1));
const opts = p.locator('.new-opt');
for (const i of [2, 3]) {
  await click(dt.nth(1));
  await click(opts.nth(i));
  await grab(`cvs new ${i}`);
}
await click(p.locator('.drawer .icon-btn').first());
await click(p.locator('.apps-btn'));
await click(p.locator('.app-toolbar .btn.primary'));
await grab('apps');
await click(p.locator('.drawer .icon-btn').first());
await click(p.locator('.share-btn'));
await p.waitForTimeout(600);
const sb = p.locator('.share-actions .btn');
await click(sb.nth(sb.count ? 2 : 2));
await grab('share');
await click(p.locator('.drawer .icon-btn').first());
// görüntüleyici
const v = await ctx.newPage();
await v.goto(BASE + '/goruntule#1.bozuk');
await v.waitForTimeout(800);
const vlist = await v.evaluate(() => window.__i18nMissing());
for (const s of vlist) found.set(s, 'viewer');
await v.close();

const arr = [...found.entries()];
if (MODE === 'harvest') fs.writeFileSync('/tmp/claude-0/harvest.json', JSON.stringify(Object.fromEntries(arr), null, 1));
console.log(`${MODE}: ${arr.length} metin`);
if (MODE === 'check') for (const [s, w] of arr) console.log(`[${w}] ${s}`);
if (errs.length) console.log('HATALAR', errs);
await b.close();
process.exit(MODE === 'check' && arr.length ? 1 : 0);
