// Faz 2 özellikleri: ATS kontrolü, ilan eşleştirme, tek sayfaya sığdır, ön yazı, DOCX, galeri, rehber, PWA
import { chromium } from 'playwright';
import fs from 'fs';
const out = '/tmp/claude-0/e2e2'; fs.mkdirSync(out, { recursive: true });
const BASE = 'http://localhost:4173';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
const p = await ctx.newPage();
const errors = [];
p.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
p.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text()));
const log = (...a) => console.log('•', ...a);

await p.goto(BASE + '/');
await p.waitForSelector('.page svg', { timeout: 60000 });
log('editör açıldı', p.url());

// ATS kontrolü
await p.getByRole('tab', { name: 'ATS kontrolü' }).click();
await p.waitForSelector('.score-num strong', { timeout: 30000 });
await p.waitForTimeout(800);
log('ATS puanı', await p.locator('.score-num strong').first().innerText(), '| kontrol sayısı', await p.locator('.chk').count());
await p.screenshot({ path: `${out}/1-ats.png` });

// İlan eşleştirme
await p.getByRole('tab', { name: 'İlana uygunluk' }).click();
await p.locator('#job-ad').fill(`Bilgi İşlem Uzmanı
En az 3 yıl deneyimli, Active Directory, VMware, Hyper-V, Fortigate, ITIL ve Jira bilen, B sınıfı ehliyetli adaylar arıyoruz.
Exchange Online ve Microsoft 365 yönetimi, PowerShell ile otomasyon. İyi derecede İngilizce.`);
await p.waitForTimeout(500);
log('eşleşme', await p.locator('.score-num strong').first().innerText(), '| eksik', await p.locator('.kw.missing').count(), '| var', await p.locator('.kw.found').count());
const before = await p.locator('.kw.missing').count();
await p.locator('.kw.missing button').first().click();
await p.waitForTimeout(400);
log('yeteneğe ekle sonrası eksik', await p.locator('.kw.missing').count(), '(önce', before + ')');
await p.screenshot({ path: `${out}/2-job.png` });

// Tek sayfaya sığdır: içeriği büyüt
await p.getByRole('tab', { name: 'Önizleme' }).click();
await p.getByRole('tab', { name: 'Tasarım' }).click();
await p.getByLabel('Metin değeri').fill('12');
await p.locator('.dgroup-head', { hasText: 'Aralıklar' }).click();
await p.getByLabel('Bölümler arası değeri').fill('26');
await p.waitForTimeout(1500);
log('sayfa durumu', await p.locator('.preview-bar .status').innerText());
const fit = p.getByRole('button', { name: /Tek sayfaya sığdır/ });
if (await fit.count()) {
  await fit.click();
  await p.waitForSelector('text=Tek sayfaya sığdırıldı', { timeout: 30000 }).catch(() => {});
  await p.waitForTimeout(1500);
  log('sığdırma sonrası', await p.locator('.preview-bar .status').innerText());
} else log('UYARI: sığdır düğmesi görünmedi');

// Madde ipuçları + örnek maddeler
await p.getByRole('tab', { name: 'Tüm bölümler' }).click();
await p.locator('.section-card .card-head', { hasText: 'İş Deneyimi' }).click();
await p.locator('.entry-toggle').first().click();
const bullet = p.locator('.bullet-input').first();
await bullet.click();
await bullet.fill('Sistem yönetiminden sorumluydum');
await p.waitForTimeout(300);
log('ipucu', (await p.locator('.bullet-hint').first().innerText()).slice(0, 80));
await p.getByRole('button', { name: 'Örnek maddeler' }).first().click();
await p.waitForTimeout(300);
await p.screenshot({ path: `${out}/3-hints.png` });
await p.locator('.example-list button').first().click();
log('örnek madde eklendi');

// Ön yazı
await p.getByRole('tab', { name: 'Ön yazı' }).click();
await p.getByLabel('Şirket').fill('Örnek Holding A.Ş.');
await p.locator('.starter', { hasText: 'Deneyimli' }).click();
await p.waitForTimeout(1500);
await p.screenshot({ path: `${out}/4-letter.png` });
const [dl1] = await Promise.all([p.waitForEvent('download'), p.getByRole('button', { name: 'Ön yazıyı PDF indir' }).click()]);
await dl1.saveAs(`${out}/${dl1.suggestedFilename()}`);
const [dl2] = await Promise.all([p.waitForEvent('download'), p.getByRole('button', { name: 'Word (.docx) indir' }).click()]);
await dl2.saveAs(`${out}/${dl2.suggestedFilename()}`);
log('ön yazı indirildi', dl1.suggestedFilename(), dl2.suggestedFilename());

// CV DOCX
await p.getByRole('button', { name: 'Diğer işlemler' }).click();
const [dl3] = await Promise.all([p.waitForEvent('download'), p.getByRole('menuitem', { name: /Word olarak indir/ }).click()]);
await dl3.saveAs(`${out}/${dl3.suggestedFilename()}`);
log('CV docx', dl3.suggestedFilename());

// CV'lerim → örnekler → yeni CV
await p.getByRole('button', { name: /CV’lerim/ }).click();
await p.getByRole('tab', { name: 'Örnekler' }).click();
await p.waitForSelector('.g-svg svg', { timeout: 60000 });
await p.waitForTimeout(2500);
log('örnek küçük resim', await p.locator('.g-svg svg').count(), '/', await p.locator('.sample').count());
await p.screenshot({ path: `${out}/5-samples.png` });
const urlBefore = p.url();
await p.locator('.sample', { hasText: 'Muhasebe' }).click();
await p.waitForSelector('.page svg', { timeout: 30000 });
await p.waitForTimeout(800);
log('örnekten yeni CV açıldı', urlBefore !== p.url());
// kök adres en son CV'yi açar
await p.goto(BASE + '/');
await p.waitForURL(/duzenle/);
log('kök adres → editör', new URL(p.url()).pathname.startsWith('/duzenle/'));
// eski adresler de editöre düşer
await p.goto(BASE + '/rehber');
await p.waitForURL(/duzenle/);
log('/rehber → editör', true);
// gizlilik penceresi
await p.getByRole('button', { name: 'Diğer işlemler' }).click();
await p.getByRole('menuitem', { name: /Gizlilik/ }).click();
log('gizlilik penceresi', await p.locator('.prose-modal h2').innerText());
await p.keyboard.press('Escape');
// service worker kaydı
const sw = await p.evaluate(async () => !!(await navigator.serviceWorker.getRegistration()));
log('service worker', sw);
console.log('HATALAR', errors);
await b.close();
