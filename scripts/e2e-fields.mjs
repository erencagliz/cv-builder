/**
 * Her alanı bir kullanıcı gibi tek tek doldurur, sonra hem önizlemede hem indirilen PDF'te
 * (pdftotext ile) doğru göründüğünü denetler. Çalıştırma: npx vite preview --port 4173 & node scripts/e2e-fields.mjs
 */
import { chromium } from 'playwright';
import { execFileSync } from 'child_process';
import fs from 'fs';

const BASE = process.env.BASE || 'http://localhost:4173';
const OUT = '/tmp/claude-0/fields';
fs.mkdirSync(OUT, { recursive: true });
const PHOTO = process.env.PHOTO || '/tmp/claude-0/photo-test.jpg';

const results = [];
const ok = (name, cond, detail = '') => {
  results.push({ name, pass: !!cond, detail });
  console.log(cond ? '  ✓' : '  ✗', name, cond ? '' : detail);
};

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ locale: 'tr-TR',  viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
const p = await ctx.newPage();
const errors = [];
p.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
p.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text()));

await p.goto(BASE + '/');
await p.waitForSelector('.page svg', { timeout: 60000 });
// Boş CV ile başla
await p.getByRole('button', { name: 'Boş başla' }).click();
await p.waitForTimeout(500);
await p.getByRole('tab', { name: 'Tüm bölümler' }).click();

const fill = async (scope, label, value) => {
  const el = scope.getByLabel(label, { exact: true });
  await el.fill(value);
};
const select = (scope, label, optLabel) => scope.getByLabel(label, { exact: true }).selectOption({ label: optLabel });
const month = async (scope, label, mm, yyyy) => {
  await scope.getByLabel(`${label} – ay`, { exact: true }).selectOption(mm);
  await scope.getByLabel(`${label} – yıl`, { exact: true }).selectOption(yyyy);
};
const tags = async (scope, label, items) => {
  const el = scope.getByLabel(label, { exact: true });
  for (const t of items) {
    await el.fill(t);
    await el.press('Enter');
  }
};
const bullets = async (scope, items) => {
  for (const t of items) {
    await scope.getByRole('button', { name: 'Madde ekle' }).click();
    await scope.locator('.bullet-input').last().fill(t);
  }
};
/** Bölüm kartını açar ve döndürür */
const section = async (title) => {
  const card = p.locator('.section-card').filter({ has: p.locator('.card-title', { hasText: new RegExp(`^${title}$`) }) });
  if (!(await card.evaluate((el) => el.classList.contains('open')))) await card.locator('.card-head').click();
  return card;
};
const addEntry = async (card, addLabel) => {
  await card.getByRole('button', { name: addLabel }).click();
  return card.locator('.entry.open');
};

console.log('1) Kişisel bilgiler ve iletişim');
const head = p.locator('.card').first();
await fill(head, 'Ad', 'Eren');
await fill(head, 'Soyad', 'Çağlı');
await fill(head, 'Unvan / hedef pozisyon', 'Bilgi İşlem Uzmanı');
await fill(head, 'E-posta', 'erencglz@icloud.com');
const phone = head.getByLabel('Telefon', { exact: true });
await phone.click();
await phone.pressSequentially('05423555649', { delay: 15 });
ok('telefon maskesi yazarken', (await phone.inputValue()) === '+90 (542) 355 56 49', await phone.inputValue());
// ortadan silme ve parantez arkasından silme
await phone.press('End');
for (let i = 0; i < 2; i++) await phone.press('Backspace');
ok('telefon: sondan 2 rakam silme', (await phone.inputValue()) === '+90 (542) 355 56', await phone.inputValue());
await phone.pressSequentially('49');
await fill(head, 'Konum', 'Esatpaşa, Ataşehir, İstanbul');
await head.getByTestId('photo-input').setInputFiles(PHOTO);
await p.waitForSelector('.photo-thumb img', { timeout: 10000 }).catch(() => {});
ok('fotoğraf küçük resmi görünüyor', (await head.locator('.photo-thumb img').count()) === 1);
// bağlantılar
await head.getByRole('button', { name: 'LinkedIn' }).click();
await head.getByLabel('LinkedIn adresi').fill('erencagli');
await head.getByRole('button', { name: 'GitHub' }).click();
await head.getByLabel('GitHub adresi').fill('https://github.com/erencagli');
await head.getByRole('button', { name: 'Başka platform' }).click();
await head.getByLabel('Bağlantı adı').fill('Portfolyo');
await head.getByLabel('Diğer adresi').fill('erencagli.dev');

console.log('2) Özet');
let c = await section('Profil');
await c.getByLabel('Özet', { exact: true }).fill('Kurumsal yapılarda **Active Directory** ve son kullanıcı desteği deneyimine sahibim.');

console.log('3) İş deneyimi');
c = await section('İş Deneyimi');
let e = await addEntry(c, 'Deneyim ekle');
await fill(e, 'Pozisyon', 'Bilgi İşlem Uzmanı');
await fill(e, 'Şirket', 'Servodata');
await fill(e, 'Şehir', 'İstanbul');
await select(e, 'Çalışma tipi', 'Tam zamanlı');
await select(e, 'Çalışma şekli', 'Hibrit');
await month(e, 'Başlangıç', '05', '2025');
await month(e, 'Bitiş', '09', '2026');
await fill(e, 'Açıklama', 'Kurum genelinde BT operasyonlarını yürüttüm.');
await bullets(e, ['150 kullanıcının Active Directory hesaplarını yönettim.', 'Group Policy ile yazıcı dağıtımını otomatikleştirdim.']);
await tags(e, 'Kullanılan teknolojiler / araçlar', ['Active Directory', 'Group Policy']);
e = await addEntry(c, 'Deneyim ekle');
await fill(e, 'Pozisyon', 'Yazılım Geliştirme Uzmanı');
await fill(e, 'Şirket', 'HIS Global');
await month(e, 'Başlangıç', '12', '2023');
await e.getByLabel('Devam ediyor').check();
ok('“Devam ediyor” işaretlenince bitiş kilitleniyor', await e.getByLabel('Bitiş – ay', { exact: true }).isDisabled());

console.log('4) Eğitim');
c = await section('Eğitim');
e = await addEntry(c, 'Eğitim ekle');
await fill(e, 'Okul', 'Kadıköy Göztepe Mesleki ve Teknik Anadolu Lisesi');
await select(e, 'Derece', 'Lise');
await fill(e, 'Bölüm / alan', 'Bilişim – Web Tasarım');
await fill(e, 'Şehir', 'İstanbul');
await fill(e, 'Not ortalaması', '85');
await select(e, 'Not ölçeği', '100 üzerinden');
await fill(e, 'Derece / onur', 'Onur belgesi');
await month(e, 'Başlangıç', '09', '2018');
await month(e, 'Bitiş', '06', '2022');
await tags(e, 'İlgili dersler', ['Web Programlama']);

console.log('5) Yetenekler, diller');
c = await section('Yetenekler');
e = await addEntry(c, 'Yetenek grubu ekle');
await fill(e, 'Grup adı', 'Sistem');
await select(e, 'Seviye', 'İleri');
await tags(e, 'Yetenekler', ['Windows Server', 'Microsoft 365']);
c = await section('Yabancı Diller');
e = await addEntry(c, 'Dil ekle');
await fill(e, 'Dil', 'İngilizce');
await select(e, 'Seviye', 'B2 – Orta üstü');
await fill(e, 'Sınav', 'YDS');
await fill(e, 'Puan', '72');

console.log('6) Sertifika, proje, kurs, gönüllülük, ödül, yayın, konuşma, üyelik');
c = await section('Sertifikalar');
e = await addEntry(c, 'Sertifika ekle');
await fill(e, 'Sertifika adı', 'CCNA');
await fill(e, 'Veren kurum', 'Cisco');
await month(e, 'Tarih', '11', '2024');
await month(e, 'Geçerlilik sonu', '11', '2027');
await fill(e, 'Sertifika numarası', 'CSCO123');
await fill(e, 'Doğrulama bağlantısı', 'cisco.com/verify/CSCO123');
c = await section('Projeler');
e = await addEntry(c, 'Proje ekle');
await fill(e, 'Proje adı', 'Haunted Haul');
await fill(e, 'Rolün', 'Geliştirici');
await fill(e, 'Bağlantı', 'roblox.com/games/123');
await month(e, 'Başlangıç', '01', '2026');
await bullets(e, ['Çok oyunculu korku oyunu geliştirdim.']);
await tags(e, 'Teknolojiler', ['Lua']);
c = await section('Kurslar ve Eğitimler');
e = await addEntry(c, 'Kurs ekle');
await fill(e, 'Kurs adı', 'Linux Sistem Yönetimi');
await fill(e, 'Kurum', 'BTK Akademi');
await fill(e, 'Süre', '40 saat');
await month(e, 'Tarih', '03', '2024');
c = await section('Gönüllü Çalışmalar');
e = await addEntry(c, 'Gönüllü çalışma ekle');
await fill(e, 'Rol', 'Eğitmen');
await fill(e, 'Kuruluş', 'TEGV');
await month(e, 'Başlangıç', '02', '2023');
c = await section('Ödüller ve Başarılar');
e = await addEntry(c, 'Ödül ekle');
await fill(e, 'Ödül', 'Yılın Çalışanı');
await fill(e, 'Veren', 'Triooz');
await month(e, 'Tarih', '12', '2022');
c = await section('Yayınlar');
e = await addEntry(c, 'Yayın ekle');
await fill(e, 'Başlık', 'Active Directory En İyi Uygulamalar');
await fill(e, 'Yayıncı / dergi', 'Medium');
await fill(e, 'Yazarlar', 'Eren Çağlı');
c = await section('Konferans ve Konuşmalar');
e = await addEntry(c, 'Konuşma ekle');
await fill(e, 'Konuşma başlığı', 'Group Policy ile Otomasyon');
await fill(e, 'Etkinlik', 'DevFest İstanbul');
c = await section('Üyelikler');
e = await addEntry(c, 'Üyelik ekle');
await fill(e, 'Kuruluş', 'Türkiye Bilişim Derneği');
await fill(e, 'Rol', 'Üye');

console.log('7) Kişisel Bilgiler bölümü');
c = await section('Kişisel Bilgiler');
await c.getByLabel('Doğum tarihi – yıl', { exact: true }).selectOption('2004');
await c.getByLabel('Doğum tarihi – ay', { exact: true }).selectOption('03');
await c.getByLabel('Doğum tarihi – gün', { exact: true }).selectOption('15');
await select(c, 'Gösterim', 'Tam tarih (12 Nisan 1998)');
await fill(c, 'Uyruk', 'T.C.');
await select(c, 'Medeni durum', 'Bekâr');
await select(c, 'Askerlik durumu', 'Muaf');
await c.getByRole('button', { name: 'B', exact: true }).click();
await fill(c, 'Ehliyet yılı', '2022');
await select(c, 'Seyahat engeli', 'Seyahat engeli yok');

console.log('8) İlgi alanları, referanslar, özel bölüm');
c = await section('İlgi Alanları');
await c.getByLabel('İlgi alanları', { exact: true }).fill('Oyun geliştirme, 3B modelleme');
c = await section('Referanslar');
e = await addEntry(c, 'Referans ekle');
await fill(e, 'Ad soyad', 'Ahmet Kaya');
await fill(e, 'Unvan', 'BT Müdürü');
await fill(e, 'Şirket', 'Servodata');
await fill(e, 'E-posta', 'ahmet@ornek.com');
await p.getByRole('button', { name: 'Özel bölüm ekle' }).click();
c = p.locator('.section-card').last();
await c.getByRole('button', { name: 'Başlığı değiştir' }).click();
await c.getByLabel('Bölüm başlığı').fill('Gönüllü Projeler');
await c.getByLabel('Bölüm başlığı').press('Enter');
e = c.locator('.entry.open');
await fill(e, 'Başlık', 'Okul ağ kurulumu');
await fill(e, 'Alt başlık', 'Göztepe MTAL');

await p.waitForTimeout(1500);
await p.screenshot({ path: `${OUT}/editor.png` });

// ---------- önizleme ----------
const preview = await p.locator('.pages').innerHTML();
ok('önizlemede fotoğraf var', /image\/(jpeg|png)/.test(preview));
ok('önizlemede ad var', preview.includes('Çağlı'));

// ---------- PDF ----------
const pdfText = async (name) => {
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 60000 }), p.getByRole('button', { name: /PDF indir/ }).first().click()]);
  const f = `${OUT}/${name}.pdf`;
  await dl.saveAs(f);
  const text = execFileSync('pdftotext', ['-layout', f, '-']).toString();
  const images = execFileSync('pdfimages', ['-list', f]).toString().trim().split('\n').length - 2;
  return { text: text.replace(/\s+/g, ' '), images, f };
};
console.log('9) PDF içeriği');
let pdf = await pdfText('full');
fs.writeFileSync(`${OUT}/full.txt`, pdf.text);
const expect = [
  'Eren Çağlı', 'Bilgi İşlem Uzmanı', 'erencglz@icloud.com', '+90 (542) 355 56 49', 'Esatpaşa, Ataşehir, İstanbul',
  'linkedin.com/in/erencagli', 'github.com/erencagli', 'erencagli.dev',
  'Active Directory ve son kullanıcı desteği', 'Servodata', 'Tam zamanlı · Hibrit', 'May 2025 – Eyl 2026', 'Kurum genelinde BT operasyonlarını',
  '150 kullanıcının Active Directory', 'Group Policy ile yazıcı', 'Teknolojiler: Active Directory, Group Policy',
  'HIS Global', 'Ara 2023 – Devam ediyor',
  'Kadıköy Göztepe Mesleki ve Teknik Anadolu Lisesi', 'Lise, Bilişim – Web Tasarım', 'Not ortalaması: 85/100', 'Onur belgesi', 'Eyl 2018 – Haz 2022', 'İlgili dersler: Web Programlama',
  'Sistem', 'Windows Server, Microsoft 365 (İleri)', 'İngilizce', 'B2 · YDS 72',
  'CCNA', 'Cisco', 'Kas 2024', 'Sertifika No: CSCO123', 'Geçerlilik: Kas 2027', 'cisco.com/verify/CSCO123',
  'Haunted Haul', 'Geliştirici', 'roblox.com/games/123', 'Çok oyunculu korku oyunu', 'Teknolojiler: Lua',
  'Linux Sistem Yönetimi', 'BTK Akademi', '40 saat', 'Eğitmen', 'TEGV', 'Yılın Çalışanı', 'Triooz',
  'Active Directory En İyi Uygulamalar', 'Medium', 'Group Policy ile Otomasyon', 'DevFest İstanbul', 'Türkiye Bilişim Derneği',
  'Doğum Tarihi: 15 Mart 2004', 'Uyruk: T.C.', 'Askerlik Durumu: Muaf', 'Ehliyet: B (2022)', 'Medeni Durum: Bekâr', 'Seyahat Engeli: Yok',
  'Oyun geliştirme, 3B modelleme', 'Ahmet Kaya', 'BT Müdürü, Servodata', 'ahmet@ornek.com',
  'GÖNÜLLÜ PROJELER', 'Okul ağ kurulumu', 'Göztepe MTAL',
  'İŞ DENEYİMİ', 'EĞİTİM', 'YETENEKLER', 'KİŞİSEL BİLGİLER', 'REFERANSLAR',
];
for (const s of expect) ok(`PDF: “${s}”`, pdf.text.includes(s), '');
ok('PDF: fotoğraf gömülü', pdf.images >= 1, `görsel sayısı ${pdf.images}`);
ok('PDF: kalın işaretleri (**) metne sızmamış', !pdf.text.includes('**'));

console.log('10) Gizleme, yeniden adlandırma, dil, uluslararası mod');
c = await section('İlgi Alanları');
await c.getByRole('button', { name: 'Bölümü gizle' }).click();
await p.getByRole('radio', { name: 'EN' }).click();
await p.waitForTimeout(800);
pdf = await pdfText('en');
ok('gizlenen bölüm PDF’te yok', !pdf.text.includes('Oyun geliştirme'));
ok('EN: başlıklar İngilizce', pdf.text.includes('EXPERIENCE') && pdf.text.includes('EDUCATION'));
ok('EN: tarih ve “Present”', pdf.text.includes('May 2025 – Sep 2026') && pdf.text.includes('Dec 2023 – Present'));
ok('EN: kişisel bilgiler', pdf.text.includes('Date of Birth: March 15, 2004') && pdf.text.includes('Military Service: Exempt'));
await p.getByRole('button', { name: 'Uluslararası', exact: true }).click();
await p.waitForTimeout(800);
pdf = await pdfText('intl');
ok('uluslararası: doğum tarihi/askerlik/medeni durum gizli', !/Date of Birth|Military|Marital/.test(pdf.text));
ok('uluslararası: fotoğraf gizli', pdf.images === 0, `görsel ${pdf.images}`);
await p.getByRole('tab', { name: 'Tüm bölümler' }).click();
ok('uluslararası: fotoğraf alanında gizlenme nedeni yazıyor', await p.getByText('Uluslararası mod açık olduğu için fotoğraf CV’de gizleniyor.').isVisible());
await p.getByRole('button', { name: 'Uluslararası', exact: true }).click();
await p.getByRole('radio', { name: 'TR' }).click();

console.log('11) Kalıcılık (sayfa yenileme)');
await p.waitForTimeout(1200);
await p.reload();
await p.waitForSelector('.page svg', { timeout: 60000 });
await p.getByRole('tab', { name: 'Tüm bölümler' }).click();
const head2 = p.locator('.card').first();
ok('yenileme sonrası telefon', (await head2.getByLabel('Telefon', { exact: true }).inputValue()) === '+90 (542) 355 56 49');
ok('yenileme sonrası fotoğraf', (await head2.locator('.photo-thumb img').count()) === 1);
c = await section('Kişisel Bilgiler');
ok('yenileme sonrası doğum tarihi', (await c.getByLabel('Doğum tarihi – gün', { exact: true }).inputValue()) === '15' && (await c.getByLabel('Doğum tarihi – ay', { exact: true }).inputValue()) === '03' && (await c.getByLabel('Doğum tarihi – yıl', { exact: true }).inputValue()) === '2004');

console.log('12) Geri al / yinele');
await head2.getByLabel('Ad', { exact: true }).fill('Değişti');
await p.waitForTimeout(700);
await p.keyboard.press('Control+z');
await p.waitForTimeout(300);
ok('Ctrl+Z ad alanını geri aldı', (await head2.getByLabel('Ad', { exact: true }).inputValue()) === 'Eren', await head2.getByLabel('Ad', { exact: true }).inputValue());

const failed = results.filter((r) => !r.pass);
console.log(`\nSONUÇ: ${results.length - failed.length}/${results.length} geçti`);
if (failed.length) console.log('BAŞARISIZ:\n' + failed.map((f) => ` - ${f.name} ${f.detail}`).join('\n'));
console.log('HATALAR', errors);
await b.close();
process.exit(failed.length || errors.length ? 1 : 0);
