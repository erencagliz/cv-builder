/**
 * Kullanılabilirlik testi: uç durumlar, hata mesajları, veri taşıma, telefonda akış.
 * Test dosyaları /tmp/claude-0/ux altında (fotoğraf uç durumları, LinkedIn benzeri PDF).
 */
import { chromium } from 'playwright';
import { execFileSync } from 'child_process';
import fs from 'fs';

const BASE = process.env.BASE || 'http://localhost:4173';
const UX = '/tmp/claude-0/ux';
const OUT = '/tmp/claude-0/uxout';
fs.mkdirSync(OUT, { recursive: true });
const results = [];
const ok = (name, cond, detail = '') => {
  results.push({ name, pass: !!cond, detail });
  console.log(cond ? '  ✓' : '  ✗', name, cond ? '' : detail);
};
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const errors = [];
const watch = (p) => {
  p.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  p.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text()));
};

// ================= Masaüstü =================
const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true, locale: 'tr-TR' });
const p = await ctx.newPage();
watch(p);
await p.goto(BASE + '/');
await p.waitForSelector('.page svg', { timeout: 60000 });
const head = p.locator('.card').first();
const photoInput = head.getByTestId('photo-input');
const lastToast = async () => (await p.locator('.toast').last().innerText().catch(() => '')).trim();
const photoNote = async () => (await head.locator('.photo-field .note').allInnerTexts()).join(' | ');
const svgHasImage = async () => /image\/(jpeg|png)/.test(await p.locator('.pages').innerHTML());

console.log('1) Fotoğraf uç durumları');
for (const [file, expectOk, label] of [
  ['alpha.png', true, 'şeffaf PNG'],
  ['photo.webp', true, 'WebP'],
  ['big.jpg', true, '5000×4000 büyük JPG'],
  ['rotated.jpg', true, 'EXIF ile döndürülmüş telefon fotoğrafı'],
  ['tiny.jpg', false, '50×50 çok küçük'],
  ['broken.jpg', false, 'bozuk dosya'],
  ['notes.txt', false, 'metin dosyası'],
]) {
  await photoInput.setInputFiles(`${UX}/${file}`);
  await p.waitForTimeout(1500);
  const note = await photoNote();
  if (expectOk) ok(`fotoğraf: ${label} yüklendi`, (await head.locator('.photo-thumb img').count()) === 1 && !/açılamadı|küçük|değil/.test(note), note);
  else ok(`fotoğraf: ${label} anlaşılır hatayla reddedildi`, /açılamadı|küçük|değil/.test(note), note || '(mesaj yok)');
}
// EXIF yönü: kırmızı şerit dik fotoğrafta üstte olmalı
await photoInput.setInputFiles(`${UX}/rotated.jpg`);
await p.waitForTimeout(1500);
const topColor = await head.locator('.photo-thumb img').evaluate(async (img) => {
  const c = document.createElement('canvas');
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const x = c.getContext('2d');
  x.drawImage(img, 0, 0);
  const [r, g, bl] = x.getImageData(c.width / 2, 5, 1, 1).data;
  return { r, g, b: bl };
});
ok('fotoğraf: telefon fotoğrafı doğru yönde (yan yatmamış)', topColor.r > 150 && topColor.g < 120, JSON.stringify(topColor));
await p.waitForTimeout(800);
ok('fotoğraf önizlemede görünüyor', await svgHasImage());
await head.getByLabel('Fotoğrafı CV’de göster').uncheck();
await p.waitForTimeout(1200);
ok('“CV’de göster” kapatınca önizlemeden kalkıyor', !(await svgHasImage()));
ok('gizlenme nedeni yazıyor', (await photoNote()).includes('CV’de göster” kapalı'), await photoNote());
await head.getByLabel('Fotoğrafı CV’de göster').check();
await p.getByRole('tab', { name: 'Tasarım' }).click();
await p.getByRole('radio', { name: 'Yuvarlak' }).click();
await p.getByRole('radio', { name: 'Solda' }).click();
await p.waitForTimeout(1200);
ok('fotoğraf şekli/konumu değişince önizleme hâlâ fotoğraflı', await svgHasImage());
await p.locator('.preview').screenshot({ path: `${OUT}/photo-round-left.png` });
await p.getByRole('tab', { name: 'Adım adım' }).click();

console.log('2) Uyarılar ve hatalı girişler');
const email = head.getByLabel('E-posta', { exact: true });
await email.fill('eren@');
await email.blur();
ok('hatalı e-posta uyarısı', await head.getByText('E-posta adresi eksik görünüyor').isVisible());
await email.fill('eren@ornek.com');
const phone = head.getByLabel('Telefon', { exact: true });
await phone.fill('');
await phone.pressSequentially('0542355');
await phone.blur();
ok('eksik telefon uyarısı', await head.getByText('Numara eksik görünüyor').isVisible());
await phone.fill('');
await phone.pressSequentially('+49 151 2345678');
ok('yabancı numara serbest kalıyor', (await phone.inputValue()) === '+49 151 2345678', await phone.inputValue());
await phone.fill('');
await phone.pressSequentially('5423555649');
ok('0 olmadan yazınca da maske', (await phone.inputValue()) === '+90 (542) 355 56 49', await phone.inputValue());
// ortadan rakam silme: "355" içindeki 3'ün arkasından
await phone.evaluate((el) => el.setSelectionRange(11, 11));
await phone.press('Backspace');
ok('ortadan silince maske bozulmuyor', /^\+90 \(542\) \d{3} \d{2} \d$|^\+90 \(542\) 35\d \d{2} \d{1,2}$/.test(await phone.inputValue()), await phone.inputValue());
await phone.fill('');
await phone.pressSequentially('05423555649');
// bağlantı hatası
await head.getByRole('button', { name: 'Web sitesi' }).click();
await head.getByLabel('Web sitesi adresi').fill('bu bir adres değil');
ok('geçersiz bağlantı uyarısı', await head.getByText('Adres geçersiz görünüyor').isVisible());
await head.getByRole('button', { name: 'Bağlantıyı sil' }).last().click();
// ters tarih
await p.getByRole('button', { name: /Sonraki: Deneyim/ }).click();
const exp = p.locator('.section-card').filter({ has: p.locator('.card-title', { hasText: /^İş Deneyimi$/ }) });
await exp.locator('.entry-toggle').first().click();
const ent = exp.locator('.entry.open');
await ent.getByLabel('Devam ediyor').uncheck();
await ent.getByLabel('Bitiş – ay', { exact: true }).selectOption('01');
await ent.getByLabel('Bitiş – yıl', { exact: true }).selectOption('2018');
ok('bitiş başlangıçtan önceyse uyarı', await ent.getByText('Bitiş tarihi başlangıçtan önce').isVisible());
await ent.getByLabel('Devam ediyor').check();
// uzun madde uyarısı
await ent.locator('.bullet-input').first().fill('Çok uzun bir madde '.repeat(14));
ok('çok uzun madde uyarısı', await ent.getByText(/çok uzun/i).first().isVisible());
await p.keyboard.press('Control+z');

console.log('3) Yedek indir → yeni CV olarak geri yükle');
await p.getByRole('button', { name: 'Diğer işlemler' }).click();
const [dl] = await Promise.all([p.waitForEvent('download'), p.getByRole('menuitem', { name: /Yedek indir/ }).click()]);
const backup = `${OUT}/${dl.suggestedFilename()}`;
await dl.saveAs(backup);
const urlBefore = p.url();
await p.getByRole('button', { name: /CV’lerim/ }).click();
await p.getByRole('tab', { name: 'Yeni CV' }).click();
const [chooser] = await Promise.all([p.waitForEvent('filechooser'), p.getByRole('button', { name: /Yedekten içe aktar/ }).click()]);
await chooser.setFiles(backup);
await p.waitForURL((u) => u.toString() !== urlBefore, { timeout: 10000 });
await p.waitForTimeout(1200);
const h2 = p.locator('.card').first();
ok('yedekten açılan CV’de telefon aynı', (await h2.getByLabel('Telefon', { exact: true }).inputValue()) === '+90 (542) 355 56 49', await h2.getByLabel('Telefon', { exact: true }).inputValue());
ok('yedekten açılan CV’de fotoğraf var', (await h2.locator('.photo-thumb img').count()) === 1);

console.log('4) LinkedIn PDF’i tarayıcıda');
await p.getByRole('button', { name: /CV’lerim/ }).click();
await p.getByRole('tab', { name: 'Yeni CV' }).click();
await p.getByRole('button', { name: /LinkedIn profilinden/ }).click();
const [li] = await Promise.all([p.waitForEvent('filechooser'), p.getByRole('button', { name: /LinkedIn PDF’ini seç/ }).click()]);
await li.setFiles(`${UX}/Profile.pdf`);
await p.waitForTimeout(3000);
const h3 = p.locator('.card').first();
ok('LinkedIn: ad', (await h3.getByLabel('Ad', { exact: true }).inputValue()) === 'Eren');
ok('LinkedIn: telefon maskeli', (await h3.getByLabel('Telefon', { exact: true }).inputValue()) === '+90 (532) 123 45 67', await h3.getByLabel('Telefon', { exact: true }).inputValue());
ok('LinkedIn: önizlemede Servodata', (await p.locator('.pages').innerHTML()).includes('Servodata'));

console.log('5) Şablonlar ve yazı tipleri');
await p.getByRole('tab', { name: 'Tasarım' }).click();
const names = ['İmza', 'Modern', 'Klasik', 'Kompakt', 'Yönetici', 'Teknik', 'Akademik'];
for (let i = 0; i < names.length; i++) {
  await p.locator('.template').nth(i).click();
  await p.waitForTimeout(700);
  const html = await p.locator('.pages').innerHTML();
  ok(`şablon ${names[i]} çiziliyor`, html.includes('<svg') && !(await p.locator('.preview-error').count()));
}
await p.locator('.font-picker').first().locator('.font-current').click();
await p.locator('.font-opt', { hasText: 'Merriweather' }).first().click();
await p.waitForTimeout(1500);
ok('yazı tipi değişince önizleme hatasız', !(await p.locator('.preview-error').count()));
const hex = p.getByLabel('Vurgu rengi kodu');
await hex.fill('#12');
ok('yarım renk kodu kabul edilmiyor (bozmuyor)', !(await p.locator('.preview-error').count()));
await hex.fill('#0E6170');
await p.getByLabel('Metin değeri').fill('99');
await p.waitForTimeout(400);
ok('punto sınırı aşılmıyor (12,5 pt)', (await p.getByLabel('Metin değeri').inputValue()) === '12.5', await p.getByLabel('Metin değeri').inputValue());

console.log('6) Sürüm geçmişi, çoğaltma, silme');
await p.getByRole('button', { name: 'Diğer işlemler' }).click();
await p.getByRole('menuitem', { name: /Sürüm geçmişi/ }).click();
ok('sürüm geçmişi açılıyor', await p.getByRole('dialog', { name: 'Sürüm geçmişi' }).waitFor({ timeout: 4000 }).then(() => true, () => false));
await p.getByRole('button', { name: 'Kapat' }).click();
await p.getByRole('button', { name: /CV’lerim/ }).click();
await p.waitForSelector('.cv-item');
const count0 = await p.locator('.cv-item').count();
await p.locator('.cv-item').first().getByRole('button', { name: /kopyasını oluştur/ }).click();
await p.waitForFunction((n) => document.querySelectorAll('.cv-item').length === n, count0 + 1, { timeout: 5000 }).catch(() => {});
ok('çoğaltma listeye ekliyor', (await p.locator('.cv-item').count()) === count0 + 1, `${count0} → ${await p.locator('.cv-item').count()}`);
await p.locator('.cv-item').last().getByRole('button', { name: /sil$/ }).click();
await p.locator('.cv-item').last().getByRole('button', { name: 'Sil', exact: true }).click();
await p.waitForFunction((n) => document.querySelectorAll('.cv-item').length === n, count0, { timeout: 5000 }).catch(() => {});
ok('silme onaylı çalışıyor', (await p.locator('.cv-item').count()) === count0, `${await p.locator('.cv-item').count()}`);
await p.keyboard.press('Escape');
await p.close();

// ================= Telefon =================
console.log('7) Telefonda baştan sona');
const mctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, acceptDownloads: true, locale: 'tr-TR' });
const m = await mctx.newPage();
watch(m);
await m.goto(BASE + '/');
await m.waitForSelector('.panel', { timeout: 60000 });
await m.getByRole('button', { name: 'Boş başla' }).click();
const mh = m.locator('.card').first();
await mh.getByLabel('Ad', { exact: true }).fill('Ayşe');
await mh.getByLabel('Soyad', { exact: true }).fill('Kılıç');
await mh.getByLabel('Telefon', { exact: true }).tap();
await mh.getByLabel('Telefon', { exact: true }).pressSequentially('05321234567');
ok('telefonda telefon maskesi', (await mh.getByLabel('Telefon', { exact: true }).inputValue()) === '+90 (532) 123 45 67');
await mh.getByTestId('photo-input').setInputFiles('/tmp/claude-0/photo-test.jpg');
await m.waitForTimeout(1500);
ok('telefonda fotoğraf yüklendi', (await mh.locator('.photo-thumb img').count()) === 1);
const pc = m.locator('.section-card').filter({ has: m.locator('.card-title', { hasText: /^Kişisel Bilgiler$/ }) });
await pc.locator('.card-head').click();
await pc.getByLabel('Doğum tarihi – gün', { exact: true }).selectOption('7');
await pc.getByLabel('Doğum tarihi – ay', { exact: true }).selectOption('09');
await pc.getByLabel('Doğum tarihi – yıl', { exact: true }).selectOption('2001');
await m.getByRole('button', { name: /Önizle/ }).tap();
await m.waitForTimeout(1800);
const mhtml = await m.locator('.pages').innerHTML();
ok('telefonda önizleme: ad + fotoğraf', mhtml.includes('Kılıç') && /image\/(jpeg|png)/.test(mhtml));
await m.screenshot({ path: `${OUT}/mobile-preview.png` });
const [mdl] = await Promise.all([m.waitForEvent('download', { timeout: 60000 }), m.getByRole('button', { name: /PDF indir/ }).tap()]);
const mpdf = `${OUT}/mobile.pdf`;
await mdl.saveAs(mpdf);
const mtext = execFileSync('pdftotext', [mpdf, '-']).toString().replace(/\s+/g, ' ');
ok('telefonda PDF: ad, telefon, doğum tarihi', mtext.includes('Ayşe Kılıç') && mtext.includes('+90 (532) 123 45 67') && mtext.includes('7 Eylül 2001'), mtext.slice(0, 200));
ok('telefonda yatay taşma yok', (await m.evaluate(() => document.documentElement.scrollWidth)) <= 390);
await m.close();

const failed = results.filter((r) => !r.pass);
console.log(`\nSONUÇ: ${results.length - failed.length}/${results.length} geçti`);
if (failed.length) console.log('BAŞARISIZ:\n' + failed.map((f) => ` - ${f.name}: ${f.detail}`).join('\n'));
console.log('HATALAR', errors);
await b.close();
process.exit(failed.length || errors.length ? 1 : 0);
