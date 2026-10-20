# CV Builder

Ücretsiz, kayıtsız, gizlilik öncelikli ve **ATS uyumlu** CV oluşturucu. Plan için `PLAN.md` dosyasına bak.

## Faz 1'de neler var
- Tüm bölümler: kişisel bilgiler, 20 platform bağlantısı, özet, deneyim (terfi gruplama), eğitim, yetenekler, diller (sınav puanıyla), sertifikalar, projeler, kurslar, gönüllülük, ödüller, yayınlar, konuşmalar, üyelikler, kişisel bilgiler (doğum tarihi, uyruk, askerlik, ehliyet, medeni durum, seyahat), ilgi alanları, referanslar ve sınırsız özel bölüm
- Adım adım sihirbaz (Profil → Deneyim → Eğitim → Beceriler ve diller → Projeler ve diğerleri → Görünüm) ve tüm bölümleri tek listede gösteren serbest mod
- 7 şablon: İmza (varsayılan: ikonlu başlıklar, satır içi tarihler, beceri tablosu), Modern, Klasik, Kompakt, Yönetici, Teknik, Akademik
- İkonlar: bölüm başlıklarında (her bölüm için 78 ikon arasından seçilebilir) ve iletişim satırında (LinkedIn, GitHub vb. kendi logolarıyla); PDF'te dekoratif (artifact) olarak işaretlenir, ATS metnine karışmaz
- Bağlantı görünümü: tam adres, platform adı veya buton
- Fotoğraf: vesikalık / yuvarlak / kare, 18–40 mm, solda veya sağda
- Tasarım: vurgu/metin/ikincil/çizgi renkleri (kontrast uyarısıyla), 20 Türkçe uyumlu yazı tipi, 6 ayrı punto, 6 aralık ayarı, kenar boşlukları, A4/Letter, 5 başlık stili, madde işareti, tarih biçimi ve konumu
- Bölümleri sürükle-bırak sıralama, gizleme, yeniden adlandırma (standart dışı başlık uyarısı)
- Canlı önizleme (PDF'in birebir aynısı), otomatik kayıt, geri al/yinele, sürüm geçmişi, birden fazla CV, çoğaltma
- TR/EN CV dili, Uluslararası mod
- Dışa aktarım: PDF, düz metin (.txt), yedek (.json), JSON Resume · İçe aktarım: yedek ve JSON Resume
- Karanlık/aydınlık tema, mobil uyum, klavye kısayolları (Ctrl+Z / Ctrl+Y / Ctrl+S / Ctrl+P)

## Faz 2 (yapay zekâ olmadan)
- **ATS kontrolü:** İndirilecek PDF tarayıcıda pdf.js ile geri okunur; ad, e-posta, telefon, bağlantılar, bölüm başlıkları, tarihler ve yeteneklerin okunup okunmadığı denetlenir. CV kalite kontrolü (eksik bilgi, 6 aydan uzun boşluk, sayı içermeyen veya pasif maddeler, uzunluk, profesyonel olmayan e-posta vb.) ve 100 üzerinden puan. ATS'nin gördüğü düz metin gösterilir ve kopyalanabilir.
- **İlana uygunluk:** İlan metni yapıştırılır; pozisyon adı, ~300 terimlik meslek/teknoloji sözlüğü, teknik görünen kelimeler ve sık geçen kelimeler (Türkçe ek atma ile) çıkarılır, CV'de geçenler ve eksikler gösterilir. Eksik terim tek tıkla Yeteneklere eklenir. "En az X yıl deneyim", ehliyet, askerlik ve İngilizce şartları ayrıca CV ile karşılaştırılır.
- **Tek sayfaya sığdır:** İkili aramayla en az küçültmeyi bulur; okunabilirlik sınırlarının (metin 8,5 pt, kenar 10 mm) altına inmez.
- **Yazım ipuçları:** Madde yazarken pasif ifade, sayı eksikliği, belirsizlik, edilgen cümle ve uzunluk için anlık ipuçları; güçlü fiil önerileri. 12 meslek için 96 örnek madde.
- **Ön yazı:** CV ile aynı tasarım; 4 başlangıç metni (deneyimli, yeni mezun, kariyer değişikliği, İngilizce) CV'deki unvan, deneyim yılı ve yeteneklerle doldurulur. PDF ve Word.
- **Word (.docx):** CV ve ön yazı; gerçek başlık stilleri ve Word madde işaretleri, tablo yok.
- **LinkedIn'den içe aktarma:** LinkedIn "PDF olarak kaydet" çıktısı konum ve yazı boyutuna göre ayrıştırılır (Türkçe ve İngilizce başlıklar). Not: LinkedIn düzenini taklit eden test PDF'leriyle doğrulandı; gerçek dışa aktarımlarla denenip gerekirse ince ayar yapılmalı.
- **CV'lerim paneli:** kayıtlı CV'ler, boş CV, 12 meslek için örnekten başlama (kurgusal kişiler), LinkedIn'den ve yedekten içe aktarma.
- **Çevrimdışı çalışma (PWA):** İlk açılıştan sonra internetsiz çalışır, telefona uygulama olarak eklenebilir.
- Uygulama doğrudan editörle açılır: ilk ziyarette örnek bir CV ve karşılama şeridi (Boş başla / LinkedIn'den doldur), sonraki ziyaretlerde en son düzenlenen CV. Tanıtım sayfası yoktur; gizlilik bilgisi menüdeki “Gizlilik ve verilerim” penceresindedir.

## ATS garantileri
- PDF Typst ile tarayıcıda dizilir: gerçek metin, etiketli PDF (Tagged PDF), gömülü ve alt kümelenmiş fontlar
- Heceleme ve ligatür kapalı (anahtar kelimeler bölünmez), üst/alt bilgi kullanılmaz, linkler düz metin olarak da yazılır
- Türkçe büyük harf dönüşümü yerel kurallarla yapılır ("EĞİTİM", "EĞITIM" değil)
- `npm test`: 7 şablon × 20 yazı tipi = 140 PDF üretir, `pdftotext` ile geri okur ve Türkçe karakterleri doğrular
- Başlık harf aralığı 0,6 pt ile sınırlı: testte 0,8–1,2 pt arasında bazı fontlarda "İŞ DENEYİMİ" başlığı "DENEY İMİ" diye okunuyordu

## Çalıştırma
Node.js 20+ gerekir.
```bash
npm install
npm run dev      # geliştirme: http://localhost:5173
npm run build    # yayın dosyaları dist/ klasörüne
npm test         # Türkçe çıkarım testi (poppler-utils / pdftotext gerekir)
npm run test:e2e # tarayıcı testi (önce: npx vite preview --port 4173)
node scripts/e2e-features.mjs   # Faz 2 özelliklerinin tarayıcı testi
node scripts/e2e-fields.mjs     # her alanı tek tek doldurup PDF'te doğrular (88 kontrol)
node scripts/e2e-ux.mjs         # fotoğraf uç durumları, uyarılar, yedek/LinkedIn, şablonlar, telefonda akış (43 kontrol)
npx vite-node scripts/ats-test.ts  # ATS ve kalite denetimi örnek çıktısı
```

## Yayınlama
`dist/` klasörü statik bir sitedir; sunucu veya veritabanı gerekmez. Uygulama gerçek adresler kullandığı için barındırıcının tüm adresleri `index.html`'e yönlendirmesi gerekir; gerekli dosyalar hazır:
- Cloudflare Pages ve Netlify: `public/_redirects` ve `public/_headers` (önbellek başlıkları dahil)
- Vercel: `vercel.json`
- GitHub Pages: derleme sonunda `dist/404.html` otomatik oluşturulur
- Dizgi motoru (`typst_ts_web_compiler_bg.wasm`) yaklaşık 28 MB, sıkıştırılmış hali ~11 MB. İlk ziyarette bir kez indirilir, sonra tarayıcı önbelleğinden gelir. Barındırıcının gzip/brotli sıkıştırmayı ve `.wasm` için `application/wasm` türünü açık tuttuğundan emin ol.
- `assets/` klasörüne uzun süreli önbellek başlığı ver (`Cache-Control: public, max-age=31536000, immutable`).
- Ürün adını ve iletişim adresini `src/config.ts` içinde değiştir. Gizlilik metnini yayından önce bir hukukçuya gözden geçirt.

## İkonlar
`src/render/icons.json` Lucide (ISC) ve Simple Icons (CC0) setlerinden üretilir: `node scripts/build-icons.mjs <lucide-static/icons> <simple-icons/icons>`. Marka logoları yalnızca ilgili profili belirtmek için kullanılır.

## Yazı tipleri
`public/fonts/` içindeki yazı tipleri Google Fonts kaynaklıdır (SIL OFL 1.1 / Apache 2.0) ve Latin + Latin Genişletilmiş setine indirgenmiştir. Yeniden üretmek için:
```bash
npm i @expo-google-fonts/roboto ...   # bkz. scripts/build-fonts.py
npm run fonts -- node_modules/@expo-google-fonts
```
Lato ve Atkinson Hyperlegible, Türkçe harfleri (ğ, ş, İ) eksik olduğu için listeye alınmadı.
