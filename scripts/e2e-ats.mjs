// ATS analizi uçtan uca: rapor, kategori puanları, madde sekmesi, "Git" ile girdiye gitme, anahtar kelime ekleme, canlı puan, mobil
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
let pass = 0, fail = 0;
const ok = (name, cond, info = '') => {
  if (cond) pass++;
  else fail++;
  console.log(`${cond ? '✓' : '✗'} ${name}${info !== '' ? ` — ${info}` : ''}`);
};
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ locale: 'tr-TR',  viewport: { width: 1440, height: 1000 } });
const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
await p.goto(BASE + '/');
await p.waitForURL(/duzenle/);
await p.getByRole('tab', { name: 'ATS kontrolü' }).click();
const rep = p.getByTestId('ats-report');
await rep.waitFor({ timeout: 90000 });
const score0 = parseInt(await p.locator('.score-num strong').first().innerText(), 10);
ok('rapor açılıyor ve puan var', score0 > 0 && score0 <= 100, score0);
ok('harf notu var', /^[A-E]$/.test((await p.locator('.grade').innerText()).trim()));
ok('5 kategori puanı', (await p.locator('.cat').count()) === 5);
ok('“Önce bunları düzelt” listesi', (await p.locator('.fixes .chk').count()) >= 1);
ok('kazanç rozeti', (await p.locator('.fixes .gain').count()) >= 1);
ok('geçen kontroller katlanabilir', (await p.locator('details.passed').count()) >= 3);
ok('rol tanındı', (await p.locator('.head-text').innerText()).includes('Rol:'));

// Maddeler sekmesi
await p.getByRole('tab', { name: /Maddeler/ }).click();
const nTab = parseInt((await p.getByRole('tab', { name: /Maddeler/ }).innerText()).match(/\d+/)[0], 10);
ok('her madde listede', (await p.locator('.bl').count()) === nTab, `${nTab}`);
const firstScore = parseInt(await p.locator('.bl-score').first().innerText(), 10);
const lastScore = parseInt(await p.locator('.bl-score').last().innerText(), 10);
ok('önce zayıflar sıralı', firstScore <= lastScore, `${firstScore} ≤ ${lastScore}`);
await p.getByRole('button', { name: 'CV sırası' }).click();
ok('CV sırasına geçiyor', (await p.locator('.bl').count()) === nTab);

// ATS metni
await p.getByRole('tab', { name: 'ATS’nin gördüğü metin' }).click();
const txt = await p.locator('.ats-text').innerText();
ok('ATS metni ad soyadı içeriyor', txt.includes('Deniz') || txt.includes('DENİZ'));

// Git → düzenleyicide girdi açılıyor
await p.getByRole('tab', { name: 'Öneriler' }).click();
const git = p.locator('.chk-items .go-btn').first();
await git.click();
await p.waitForTimeout(500);
ok('“Git” Tüm bölümler sekmesine geçiyor', (await p.getByRole('tab', { name: 'Tüm bölümler' }).getAttribute('aria-selected')) === 'true');
ok('ilgili girdi açılıyor', (await p.locator('.entry.open').count()) === 1);

// canlı madde puanı: açık girdinin ilk maddesini zayıf yaz
const ta = p.locator('.entry.open textarea').last();
await ta.fill('Çeşitli işlerden sorumluydum');
await p.waitForTimeout(200);
const badge = p.locator('.entry.open .b-score').first();
ok('yazarken madde puanı görünüyor', (await badge.count()) === 1);
const live = parseInt(await badge.innerText(), 10);
ok('zayıf madde düşük puan alıyor', live < 40, live);
await ta.fill('PowerShell betikleriyle dağıtımı otomatikleştirerek destek taleplerini %35 azalttım');
await p.waitForTimeout(200);
const live2 = parseInt(await p.locator('.entry.open .b-score').first().innerText(), 10);
ok('güçlü madde yüksek puan alıyor', live2 >= 85, live2);
await ta.fill('Çeşitli işlerden sorumluydum');

// puan değişiklikle güncelleniyor
await p.waitForTimeout(1500);
const score1 = parseInt(await p.locator('.score-num strong').first().innerText(), 10);
await p.waitForFunction((s0) => parseInt(document.querySelector('.score-num strong')?.textContent || '0', 10) !== s0, score1, { timeout: 30000 }).catch(() => {});
const score2 = parseInt(await p.locator('.score-num strong').first().innerText(), 10);
ok('zayıf madde toplam puanı düşürüyor', score2 < score0, `${score0} → ${score2}`);

// rol anahtar kelimesi ekleme (+)
const kw = p.locator('.chk .kw.missing button').first();
if (await kw.count()) {
  const term = (await p.locator('.chk .kw.missing').first().innerText()).trim();
  await kw.click();
  await p.waitForTimeout(300);
  ok('anahtar kelime yeteneklere eklendi', (await p.locator('.toast').innerText()).includes(term), term);
} else ok('anahtar kelime ekleme düğmesi', true, 'eksik anahtar kelime yok (atlandı)');

// e-postayı sil → kritik
await p.getByRole('tab', { name: 'Tüm bölümler' }).click();
await p.locator('[data-sec=header] .card-head').evaluate((el) => el.closest('section').classList.contains('open') || el.click());
await p.getByLabel('E-posta', { exact: true }).fill('');
await p.waitForFunction(() => /Kritik/.test(document.querySelector('.grade-row h3')?.textContent || ''), null, { timeout: 30000 }).catch(() => {});
const sc3 = parseInt(await p.locator('.score-num strong').first().innerText(), 10);
ok('e-posta yokken puan 49 ile sınırlanıyor', sc3 <= 49, sc3);
await p.keyboard.press('Control+z');

// mobil
const m = await b.newPage({ locale: 'tr-TR',  viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await m.goto(BASE + '/');
await m.waitForURL(/duzenle/);
await m.locator('.mobile-tabs button').nth(1).click();
await m.getByRole('tab', { name: 'ATS kontrolü' }).click();
await m.getByTestId('ats-report').waitFor({ timeout: 90000 });
const overflow = await m.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
ok('mobilde yatay taşma yok', overflow <= 1, overflow);
await m.screenshot({ path: '/tmp/claude-0/ats/mobile.png' });

ok('sayfa hatası yok', errs.length === 0, errs.join(' | '));
console.log(`\n${pass} geçti, ${fail} başarısız`);
await b.close();
process.exit(fail ? 1 : 0);
