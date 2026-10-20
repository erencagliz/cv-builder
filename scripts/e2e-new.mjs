// Yeni özellikler: motor ilerlemesi, paylaşım bağlantısı + görüntüleyici, başvuru takibi, eski CV içe aktarma, yedekle/geri yükle, kurtarma ekranı
import { chromium } from 'playwright';
import fs from 'fs';
const BASE = process.env.BASE || 'http://localhost:4173';
let pass = 0, fail = 0;
const ok = (name, cond, info = '') => {
  cond ? pass++ : fail++;
  console.log(`${cond ? '✓' : '✗'} ${name}${info !== '' ? ` — ${info}` : ''}`);
};
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ locale: 'tr-TR',  viewport: { width: 1440, height: 950 }, acceptDownloads: true, permissions: ['clipboard-read', 'clipboard-write'] });
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', (e) => errs.push(e.message));

// motor ilerlemesi (yavaş ağ: wasm isteğini geciktir)
await p.route(/typst_ts_web_compiler_bg.*\.wasm/, async (route) => {
  await new Promise((r) => setTimeout(r, 1500));
  route.continue();
});
await p.goto(BASE + '/');
await p.waitForURL(/duzenle/);
const st = await p.locator('.preview .status').innerText();
ok('motor yüklenirken durum görünüyor', /Dizgi motoru/.test(st), st);
ok('ilerleme çubuğu var', (await p.locator('.sk-progress').count()) === 1);
await p.waitForSelector('.page-wrap svg', { timeout: 90000 });
ok('önizleme çizildi', true);
await p.unroute(/typst_ts_web_compiler_bg.*\.wasm/);

// paylaşım
await p.getByRole('button', { name: 'Paylaş' }).click();
await p.waitForFunction(() => document.querySelector('.share-url')?.value?.includes('/goruntule#1.'));
const url = await p.locator('.share-url').inputValue();
ok('paylaşım bağlantısı oluştu', url.startsWith(BASE + '/goruntule#1.'), `${url.length} karakter`);
await p.getByRole('button', { name: 'Bağlantıyı kopyala' }).click();
ok('kopyalandı bildirimi', (await p.locator('.toast').last().innerText()).includes('kopyalandı'));
await p.getByRole('button', { name: /QR ile aktar/ }).click();
ok('QR kodu çizildi', (await p.locator('.qr svg').count()) === 1);
await p.keyboard.press('Escape');

const v = await ctx.newPage();
v.on('pageerror', (e) => errs.push('viewer: ' + e.message));
await v.goto(url);
await v.waitForSelector('.page-wrap svg', { timeout: 90000 });
ok('görüntüleyici CV’yi çiziyor', (await v.locator('.viewer-name').innerText()).includes('Deniz'));
const [dl] = await Promise.all([v.waitForEvent('download'), v.getByRole('button', { name: 'PDF indir' }).click()]);
ok('görüntüleyiciden PDF iniyor', /\.pdf$/.test(dl.suggestedFilename()), dl.suggestedFilename());
await v.getByRole('button', { name: /CV’lerime kopyala/ }).click();
await v.waitForURL(/duzenle/);
ok('CV’lerime kopyalayınca düzenleyici açılıyor', /duzenle/.test(v.url()));
await v.goto(BASE + '/goruntule#1.bozuk');
ok('bozuk bağlantıda anlaşılır hata', (await v.locator('.empty-state h1').innerText()).includes('açılamadı'));
await v.close();

// başvurular
await p.getByRole('button', { name: /Başvurular/ }).first().click();
await p.getByRole('button', { name: 'Başvuru ekle' }).click();
const dr = p.locator('.drawer');
await dr.getByLabel('Pozisyon').fill('Sistem Uzmanı');
await dr.getByLabel('Şirket').fill('Örnek A.Ş.');
await p.locator('.app-status').first().selectOption('interview');
await p.getByRole('button', { name: 'Tamam' }).click();
ok('başvuru listede', (await p.locator('.app').first().innerText()).includes('Sistem Uzmanı'));
await p.locator('.app-filters button', { hasText: 'Görüşme' }).click();
ok('durum süzgeci çalışıyor', (await p.locator('.app').count()) === 1);
await p.locator('.app-filters button', { hasText: 'Teklif' }).click();
ok('boş süzgeçte liste boş', (await p.locator('.app').count()) === 0);
const [csv] = await Promise.all([p.waitForEvent('download'), p.getByRole('button', { name: 'CSV' }).click()]);
ok('CSV iniyor', csv.suggestedFilename() === 'basvurular.csv');
await p.keyboard.press('Escape');
// ilandan başvuru
await p.getByRole('tab', { name: 'İlana uygunluk' }).click();
await p.locator('#job-ad').fill('Bilgi İşlem Uzmanı\nAnka Teknoloji A.Ş.\nActive Directory, Intune ve Azure deneyimi olan, en az 3 yıl tecrübeli adaylar arıyoruz.');
await p.getByRole('button', { name: /Başvurdum, kaydet/ }).click();
await p.waitForSelector('.app-list .app');
const first = await p.locator('.app').first().innerText();
ok('ilandan başvuru: pozisyon ve şirket tahmin edildi', first.includes('Bilgi İşlem Uzmanı') && first.includes('Anka Teknoloji A.Ş.'), first.replace(/\n/g, ' | '));
await p.keyboard.press('Escape');

// eski CV içe aktarma
await p.getByRole('button', { name: /CV’lerim/ }).click();
await p.getByRole('tab', { name: 'Yeni CV' }).click();
await p.locator('.new-opt', { hasText: 'Eski CV’mi yükle' }).click();
const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.getByRole('button', { name: 'Dosya seç' }).click()]);
await fc.setFiles('scripts/fixtures/sidebar.pdf');
await p.waitForURL((u) => !u.href.includes(url.split('/duzenle/')[1] ?? '@@'), { timeout: 30000 }).catch(() => {});
await p.waitForFunction(() => document.querySelector('.doc-name')?.value === 'sidebar', null, { timeout: 30000 });
ok('PDF içe aktarıldı ve yeni CV açıldı', (await p.locator('.doc-name').inputValue()) === 'sidebar');
await p.getByRole('tab', { name: 'Tüm bölümler' }).click();
const hdr = await p.locator('[data-sec=header] .card-meta').innerText();
ok('içe aktarılan ad', hdr.includes('Selin Demir'), hdr);
ok('içe aktarılan deneyimler', (await p.locator('[data-sec=experience] .card-head').innerText()).includes('2'));
// metin dosyası
await p.getByRole('button', { name: /CV’lerim/ }).click();
await p.getByRole('tab', { name: 'Yeni CV' }).click();
await p.locator('.new-opt', { hasText: 'Eski CV’mi yükle' }).click();
const [fc2] = await Promise.all([p.waitForEvent('filechooser'), p.getByRole('button', { name: 'Dosya seç' }).click()]);
await fc2.setFiles('scripts/fixtures/ahmet.txt');
await p.waitForFunction(() => document.querySelector('.doc-name')?.value === 'ahmet', null, { timeout: 30000 });
ok('metin dosyası içe aktarıldı', true);
// desteklenmeyen dosya
await p.getByRole('button', { name: /CV’lerim/ }).click();
await p.getByRole('tab', { name: 'Yeni CV' }).click();
await p.locator('.new-opt', { hasText: 'Eski CV’mi yükle' }).click();
fs.writeFileSync('/tmp/claude-0/imp/x.png', 'x');
const [fc3] = await Promise.all([p.waitForEvent('filechooser'), p.getByRole('button', { name: 'Dosya seç' }).click()]);
await fc3.setFiles('/tmp/claude-0/imp/x.png');
await p.waitForTimeout(500);
ok('desteklenmeyen dosyada anlaşılır hata', (await p.locator('.toast').last().innerText()).includes('Desteklenen'));

// yedekle → sil → geri yükle
await p.getByRole('tab', { name: 'Kayıtlı' }).click();
const before = await p.locator('.cv-item').count();
const [bk] = await Promise.all([p.waitForEvent('download'), p.getByRole('button', { name: 'Tümünü yedekle' }).click()]);
const bkPath = '/tmp/claude-0/imp/backup.json';
await bk.saveAs(bkPath);
const data = JSON.parse(fs.readFileSync(bkPath, 'utf8'));
ok('yedek tüm CV’leri ve başvuruları içeriyor', data.format === 'cv-builder-backup' && data.cvs.length === before && data.applications.length === 2, `${data.cvs.length} CV, ${data.applications.length} başvuru`);
const [fc4] = await Promise.all([p.waitForEvent('filechooser'), p.getByRole('button', { name: 'Yedeği geri yükle' }).click()]);
await fc4.setFiles(bkPath);
await p.waitForTimeout(800);
ok('geri yükleme üzerine yazmadan kopyalar ekliyor', (await p.locator('.cv-item').count()) === before * 2, `${before} → ${await p.locator('.cv-item').count()}`);
await p.keyboard.press('Escape');

ok('sayfa hatası yok', errs.length === 0, errs.join(' | '));

// kurtarma ekranı: bozuk kayıt ile render hatası zorla
const c = await ctx.newPage();
await c.goto(BASE + '/');
await c.waitForURL(/duzenle/);
await c.evaluate(async () => {
  const req = indexedDB.open('cv-builder');
  await new Promise((r) => (req.onsuccess = r));
  const db = req.result;
  const tx = db.transaction('cvs', 'readwrite');
  tx.objectStore('cvs').put({ id: 'bozuk1', name: 'bozuk', updatedAt: Date.now() + 1e9, data: { id: 'bozuk1', personal: null, sections: 5, design: 'x' } });
  await new Promise((r) => (tx.oncomplete = r));
});
await c.goto(BASE + '/duzenle/bozuk1');
await c.waitForTimeout(1500);
const crash = await c.locator('.crash, .editor').first().getAttribute('class');
ok('bozuk veride beyaz ekran yok (kurtarma ekranı ya da onarılmış düzenleyici)', !!crash, crash);
await c.screenshot({ path: '/tmp/claude-0/imp/crash.png' });

console.log(`\n${pass} geçti, ${fail} başarısız`);
await b.close();
process.exit(fail ? 1 : 0);
