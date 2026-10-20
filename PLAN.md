# CV Builder: Ürün ve Teknik Plan

> Amaç: Kullanıcının tüm bilgilerini bir kez girdiği, tasarımı istediği gibi ayarlayabildiği ve **ATS'nin (aday takip sistemi) kusursuz okuyabildiği** PDF'i ücretsiz ve filigransız üreten, Türkiye odaklı ama uluslararası kullanılabilen bir CV oluşturucu.
>
> Ana fikir: Kullanıcı tasarımda tam özgürlüğe sahip olur ama ATS uyumluluğunu bozacak hiçbir seçenek sunulmaz. Güzellik ve okunabilirlik birbirinin önüne geçmez.

---

## 1. Neden insanlar diğer platformları bırakıp bunu kullansın?

| Sorun (rakiplerde) | Bizim cevabımız |
|---|---|
| CV'yi doldurtup indirirken ücret istiyorlar (resume.io, Zety, Novorésumé) | İndirme her zaman ücretsiz, filigran yok, kayıt zorunlu değil |
| Canva gibi araçlar güzel ama ATS PDF'i okuyamıyor (metin kutuları, sütunlar, görseller) | Her şablon tek akışlı metin üretir; ATS'nin göreceği metni kullanıcıya **canlı gösteririz** |
| Türkçe karakterler PDF'ten bozuk çıkıyor (ı→i, ş→s, ğ→g ya da tamamen kayıp) | Tüm fontlar Türkçe glif ve doğru ToUnicode eşlemesiyle gömülür; her PDF çıktısı otomatik test edilir |
| Türkiye'ye özgü alanlar yok (askerlik, ehliyet, doğum tarihi, medeni durum) | Hepsi var, hepsi isteğe bağlı, her birinin yanında "bu alanı eklemeli miyim?" ipucu |
| Verileri sunucuya gönderiyorlar, KVKK belirsiz | Varsayılan olarak veriler **tarayıcıdan çıkmaz**; hesap/senkron isteğe bağlı |
| Tek dil | TR/EN tek tıkla: başlıklar, ay adları, tarih biçimleri otomatik değişir |
| Yalnızca PDF | PDF + DOCX + düz metin + JSON (taşınabilir veri) |

**Tek cümlelik konumlandırma:** "Türkiye'nin ücretsiz, gizlilik öncelikli, ATS'nin gerçekten okuyabildiği CV oluşturucusu."

---

## 2. Hedef kullanıcılar

1. **Yeni mezun / öğrenci**: Hiç CV yazmamış, rehberlik istiyor.
2. **Deneyimli profesyonel**: Hızlı güncelleme, ilana göre farklı sürümler istiyor.
3. **Yurt dışına başvuran**: İngilizce CV, fotoğrafsız, doğum tarihsiz (uluslararası norm).
4. **Kariyer danışmanı / İK**: Birden fazla kişinin CV'sini yönetir (Faz 3).

---

## 3. Veri modeli: girilebilecek tüm bilgiler

Altyapı **JSON Resume** şemasıyla uyumlu olacak (içe/dışa aktarım için), Türkiye'ye özgü alanlarla genişletilecek. Her bölüm gizlenebilir, yeniden adlandırılabilir ve sıralanabilir.

### 3.1 Kişisel bilgiler
- Ad, soyad
- Unvan / hedef pozisyon (ör. "Bilgi İşlem Uzmanı")
- E-posta, telefon (ülke kodlu, otomatik biçimlendirme: +90 5xx xxx xx xx)
- Konum: şehir / ilçe / ülke (tam adres önerilmez, ipucuyla açıklanır)
- Doğum tarihi (gösterim biçimi: tam tarih / yalnızca yıl / yaş)
- Uyruk
- Askerlik durumu: Yapıldı (terhis tarihi) · Muaf · Tecilli (tecil bitiş tarihi) · Yükümlü değil
- Ehliyet: sınıf(lar) (A, A2, B, BE, C, D…) ve alınma yılı
- Medeni durum
- Seyahat engeli durumu ("Seyahat engeli yok")
- Fotoğraf (isteğe bağlı, ATS uyarısıyla; bkz. 6.3)

### 3.2 Bağlantılar (sınırsız, sıralanabilir)
LinkedIn, GitHub, GitLab, kişisel web sitesi, portfolyo, Behance, Dribbble, Medium, Stack Overflow, Kaggle, YouTube, X, Instagram, ArtStation, Google Scholar, ORCID, Roblox/itch.io ve **özel bağlantı**.
- Kullanıcı adını yazınca tam URL otomatik oluşur (`erencagli` → `linkedin.com/in/erencagli`)
- PDF'te bağlantı hem **okunabilir metin** olarak yazılır (ATS için) hem tıklanabilir olur
- URL geçerlilik kontrolü (biçim düzeyinde)

### 3.3 Özet / Profil
- Serbest metin, karakter sayacı, önerilen uzunluk göstergesi (2-4 cümle)

### 3.4 İş deneyimi (sınırsız)
- Pozisyon, şirket, şirket web sitesi (isteğe bağlı), şehir, çalışma şekli (tam zamanlı, yarı zamanlı, stajyer, serbest, uzaktan, hibrit)
- Başlangıç / bitiş (ay+yıl; "Devam ediyor" seçeneği)
- Açıklama + madde işaretli başarılar (sürükle-bırak sıralama)
- Kullanılan teknolojiler/araçlar (etiket)
- Aynı şirkette birden fazla pozisyon (terfi) gruplama

### 3.5 Eğitim
- Okul, bölüm/alan, derece (Lise, Ön lisans, Lisans, Yüksek lisans, Doktora, Sertifika programı)
- Başlangıç/bitiş, şehir
- Not ortalaması (4'lük / 100'lük ölçek seçimi, isteğe bağlı)
- Onur/derece, tez, ilgili dersler

### 3.6 Yetenekler
- Gruplu yetenekler (ör. "Sistem: Active Directory, Group Policy" / "Yazılım: …")
- İsteğe bağlı seviye; ama PDF'te **çubuk/yıldız grafiği yok** (ATS okuyamaz), seviye metinle yazılır

### 3.7 Diller
- Dil + seviye: CEFR (A1-C2) veya sözel (Başlangıç / Orta / İleri / Ana dil)
- Sınav sonuçları (YDS, YÖKDİL, IELTS, TOEFL, TOEIC) ve puanı

### 3.8 Diğer bölümler (hepsi isteğe bağlı)
- Sertifikalar (ad, kurum, tarih, sertifika numarası/doğrulama linki)
- Projeler (ad, rol, tarih, link, açıklama, teknolojiler)
- Kurslar / eğitimler
- Gönüllü çalışmalar
- Ödüller ve başarılar
- Yayınlar
- Konferans / konuşmalar
- Üyelikler (dernek, topluluk)
- Hobiler / ilgi alanları
- Referanslar (ad, unvan, şirket, iletişim) veya "Talep edildiğinde sunulacaktır" anahtarı
- **Özel bölüm**: Kullanıcı kendi başlığıyla sınırsız bölüm ekleyebilir

---

## 4. Tasarım özelleştirme (kullanıcının değiştirebileceği her şey)

### 4.1 Şablonlar
Hepsi tek sütunlu, metin akışlı, ATS güvenli. Görünümleri belirgin şekilde farklı:
1. **Klasik**: Ortalanmış ad, ince ayırıcı çizgiler, serif
2. **Modern**: Sola hizalı, renkli başlıklar, sans-serif
3. **Kompakt**: Yoğun bilgi, tek sayfaya sığdırma odaklı
4. **Yönetici**: Geniş boşluklar, büyük ad, sade
5. **Teknik**: Yetenekler üstte, proje odaklı (yazılımcılar için)
6. **Akademik**: Yayınlar ve eğitim önde

### 4.2 Renkler
- Vurgu rengi (başlıklar, çizgiler, linkler): hazır palet + serbest renk seçici (HEX/RGB)
- Metin rengi, ikincil metin rengi (tarih, konum)
- **Kontrast denetimi**: Okunmayacak açıklıkta bir renk seçilirse uyarı (WCAG AA)
- "Siyah-beyaz yazdırma önizlemesi"

### 4.3 Yazı tipleri
- Başlık fontu ve gövde fontu ayrı seçilir
- Yalnızca **Türkçe karakterleri tam destekleyen, gömülebilir lisanslı** fontlar listelenir:
  - Sans: Roboto, Open Sans, Lato, Source Sans 3, IBM Plex Sans, Noto Sans, Carlito (Calibri ölçülerinde), Liberation Sans (Arial ölçülerinde), Atkinson Hyperlegible, Montserrat, PT Sans, Fira Sans
  - Serif: Noto Serif, Liberation Serif (Times ölçülerinde), Merriweather, Source Serif 4, EB Garamond, Libre Baskerville, PT Serif, Crimson Pro
- Her font yanında Türkçe örnek: "Çağrı Şükrü Öztürk, İğdır"

### 4.4 Boyutlar ve aralıklar
- Punto ayrı ayrı: ad, unvan, bölüm başlığı, alt başlık (pozisyon/okul), gövde, yan bilgi (tarih/konum)
- Satır aralığı, paragraf aralığı, bölümler arası boşluk
- Sayfa kenar boşlukları (üst/alt/sol/sağ, mm cinsinden)
- Sayfa boyutu: A4 (varsayılan) / Letter
- Hazır yoğunluk seçenekleri: Ferah / Normal / Sıkı
- **"Tek sayfaya sığdır"** düğmesi: punto ve boşlukları güvenli sınırlar içinde otomatik küçültür

### 4.5 Düzen ayrıntıları
- Bölüm sırası (sürükle-bırak), bölüm adlarını değiştirme, gizleme
- Başlık stili: BÜYÜK HARF / Normal, alt çizgili / çizgisiz, harf aralığı
- Madde işareti: • – ▸ ○ (hepsi ATS'nin okuduğu Unicode karakterler)
- Tarih biçimi: "Eki 2024", "Ekim 2024", "10/2024", "2024-10"
- Tarih konumu: sağa yaslı / satır altında
- İletişim satırı ayırıcısı: · | •
- Ad hizalaması: sola / ortaya

### 4.6 Ayar profilleri
- Kullanıcı tasarım ayarlarını "tema" olarak kaydedip başka CV'lerinde kullanabilir

---

## 5. Editör deneyimi

- **Sol: form, sağ: birebir PDF önizlemesi** (mobilde sekme geçişi)
- Her tuşta canlı güncelleme (debounce ile, 150 ms)
- Otomatik kaydetme + "kaydedildi" göstergesi
- Geri al / yinele (Ctrl+Z / Ctrl+Y), tam geçmiş
- Birden fazla CV (ör. "Bilgi İşlem - TR", "Software Dev - EN") ve **CV'yi çoğaltma**
- Sürüm geçmişi: Her CV'nin önceki hallerine dönebilme
- Zengin metin yalnızca güvenli biçimlerle: **kalın**, *italik*, link (ATS'yi bozan hiçbir şey yok)
- Sürükle-bırak ile bölüm ve madde sıralama
- Klavye ile tam kullanım, ekran okuyucu desteği
- Örnek veriyle doldurulmuş başlangıç ("Örnek CV'yi göster")
- Adım adım sihirbaz modu (yeni başlayanlar için) ve serbest editör modu
- Karanlık / aydınlık tema

---

## 6. ATS uyumluluğu: teknik garanti

### 6.1 PDF'in kendisi
- **Gerçek metin**: Görüntü değil, seçilebilir ve kopyalanabilir metin
- **Doğru okuma sırası**: Tek akış; sütun, tablo ve metin kutusu yok
- **Türkçe çıkarım testi**: Her şablon + her font kombinasyonu için otomatik test: PDF üretilir, metni geri çıkarılır, girilen metinle karakter karakter karşılaştırılır (ı, İ, ş, Ş, ğ, Ğ, ç, Ç, ö, Ö, ü, Ü)
- **Etiketli PDF (Tagged PDF / PDF/UA)**: Başlık hiyerarşisi ve okuma sırası etiketlerle belirtilir; hem ATS hem ekran okuyucu için
- **Meta veriler**: Başlık ("Eren Çağlı - CV"), yazar, anahtar kelimeler, dil (tr-TR / en-US)
- İletişim bilgileri sayfa üst bilgisine/alt bilgisine (header/footer) **konmaz**; bazı ATS'ler orayı okumaz
- Linkler görünür metin olarak yazılır
- Standart bölüm başlıkları ("İş Deneyimi", "Eğitim", "Yetenekler" / "Experience", "Education", "Skills"); kullanıcı başlığı standart dışı bir şeyle değiştirirse uyarı
- Dosya adı otomatik: `Ad-Soyad-CV.pdf`
- Dosya boyutu hedefi < 300 KB (font alt kümeleme / subsetting)

### 6.2 "ATS'nin gözünden" paneli (öne çıkan özellik)
Oluşan PDF'ten tarayıcıda metin çıkarılır ve kullanıcıya düz metin olarak gösterilir: "İşe alım sistemi CV'ni böyle okuyor." Bölümler tanınıyor mu, tarihler ayrıştırılabiliyor mu, renk kodlarıyla işaretlenir.

### 6.3 Fotoğraf ikilemi
Türkiye'de fotoğraflı CV yaygın, ama ATS için gereksiz ve uluslararası başvurularda önerilmez. Çözüm:
- Fotoğraf eklenebilir, ama varsayılan kapalı
- Fotoğraf yalnızca dekoratif katman olarak eklenir, metin akışını bozmaz
- "Yurt dışına başvuruyorsan fotoğrafı ve doğum tarihini kaldırmanı öneririz" ipucu
- Tek tıkla **"Uluslararası mod"**: fotoğraf, doğum tarihi, medeni durum, askerlik gizlenir; dil İngilizce olur

### 6.4 CV kalite denetimi (puan + öneriler)
- Eksik zorunlu bilgiler (e-posta, telefon, en az bir deneyim/eğitim)
- Tarih tutarsızlıkları ve açıklanmamış boşluklar (6 aydan uzun)
- Çok uzun maddeler (> 2 satır), çok uzun CV (> 2 sayfa)
- Ölçülebilir sonuç içermeyen maddeler ("%30", "50 kullanıcı" gibi sayı yok)
- Zayıf fiiller ("sorumluydum" → "yönettim, kurdum, azalttım" önerisi)
- Yazım denetimi (TR ve EN)
- Profesyonel olmayan e-posta adresi uyarısı
- Tutarsız tarih biçimi, tutarsız noktalama

### 6.5 İlan eşleştirme
- Kullanıcı iş ilanı metnini yapıştırır
- Anahtar kelimeler çıkarılır, CV'de bulunan/bulunmayanlar gösterilir (ör. "Active Directory ✓, VMware ✗")
- Tamamen tarayıcıda çalışır (veri gönderilmez)

---

## 7. İçe ve dışa aktarım

**İçe aktarım**
- JSON Resume / kendi JSON formatımız
- LinkedIn profil PDF'i ("PDF olarak kaydet" çıktısı) ayrıştırma
- Mevcut CV PDF/DOCX'ten metin çıkarıp alanlara dağıtma (kullanıcı onaylar)

**Dışa aktarım**
- PDF (ana çıktı)
- DOCX (bazı ATS'ler ve İK'cılar Word ister): aynı içerik, sade biçim
- Düz metin (.txt): kariyer sitelerindeki "CV'ni yapıştır" kutuları için
- JSON (yedek / başka cihaza taşıma)
- Paylaşılabilir web bağlantısı (isteğe bağlı, Faz 2)

---

## 8. Ön yazı (cover letter) oluşturucu
- CV ile aynı tasarım ayarlarını kullanır (uyumlu set)
- Şirket adı, pozisyon, hitap, gövde, kapanış
- Hazır yapı şablonları (yeni mezun, kariyer değişikliği, deneyimli)

---

## 9. Gizlilik ve KVKK
- **Yerel öncelikli**: Varsayılan olarak tüm veriler tarayıcıda (IndexedDB) tutulur
- Hesap açmak isteğe bağlı; açılırsa veriler şifreli senkronize edilir
- KVKK aydınlatma metni, gizlilik politikası, çerez politikası
- Analitik: çerezsiz, kişisel veri içermeyen (ör. Plausible / Umami)
- "Tüm verilerimi sil" ve "tüm verilerimi indir" düğmeleri
- CV içeriği hiçbir zaman analitiğe veya üçüncü tarafa gitmez

---

## 10. Teknik mimari

### 10.1 Önerilen yığın
| Katman | Seçim | Neden |
|---|---|---|
| Arayüz | **React + TypeScript + Vite** | Geniş ekosistem, hızlı geliştirme |
| Durum yönetimi | Zustand + Immer (geri al/yinele için yama geçmişi) | Basit, performanslı |
| Form doğrulama | Zod (şema hem doğrulama hem tip kaynağı) | Tek kaynaktan veri modeli |
| Yerel depolama | IndexedDB (Dexie) | Büyük veri, fotoğraf, sürüm geçmişi |
| PDF motoru | **Typst (WebAssembly, tarayıcıda)** | Aşağıda |
| PDF metin çıkarımı | pdf.js | ATS paneli ve testler |
| DOCX | `docx` kütüphanesi | Tarayıcıda Word dosyası |
| Sürükle-bırak | dnd-kit | Erişilebilir |
| Çoklu dil | i18next | Arayüz ve CV dili ayrı |
| Test | Vitest, Playwright, görsel karşılaştırma | |
| Barındırma | Cloudflare Pages / Vercel (statik) | Sunucu maliyeti yok |

### 10.2 PDF motoru kararı (en kritik karar)
**Önerilen: Typst'i WebAssembly ile tarayıcıda çalıştırmak.**
- Önizleme ile PDF **birebir aynı** (aynı motor SVG ve PDF üretir)
- Profesyonel dizgi kalitesi, Türkçe heceleme (`lang: "tr"`)
- Etiketli PDF desteği, font alt kümeleme, gerçek metin
- Sunucu gerekmez → maliyet sıfır, veri cihazdan çıkmaz (KVKK avantajı)
- Çevrimdışı çalışabilir (PWA)
- Dezavantaj: İlk yüklemede birkaç MB WASM indirilir (sonra önbellekte)

**Alternatif: Sunucuda başsız Chromium (Playwright) ile HTML→PDF**
- Önizleme HTML/CSS, aynı HTML sunucuda PDF'e çevrilir
- Çok olgun, CSS ile tasarım kolay
- Dezavantaj: Sunucu maliyeti, CV verisi sunucuya gider, ölçekleme gerekir

**Elenen: jsPDF / pdfmake gibi istemci kütüphaneleri**: Dizgi kalitesi düşük, önizleme ile PDF arasında fark oluşur, etiketli PDF yok.

### 10.3 Proje yapısı
```
cv-builder/
├─ src/
│  ├─ model/          # Zod şemaları, varsayılanlar, JSON Resume dönüştürücü
│  ├─ store/          # Zustand, geri al/yinele, IndexedDB senkronu
│  ├─ editor/         # Form bölümleri, sihirbaz, sürükle-bırak
│  ├─ design/         # Tema paneli: renk, font, punto, boşluk
│  ├─ render/         # Typst WASM, şablonlar (.typ), font yükleyici
│  ├─ ats/            # Metin çıkarımı, kalite denetimi, ilan eşleştirme
│  ├─ export/         # PDF, DOCX, TXT, JSON
│  ├─ import/         # JSON, LinkedIn PDF, mevcut CV
│  ├─ i18n/           # tr, en
│  └─ pages/          # Ana sayfa, editör, CV listesi, gizlilik
├─ templates/         # Typst şablonları
├─ fonts/             # Gömülecek açık lisanslı fontlar (OFL / Apache)
└─ tests/             # Türkçe çıkarım testleri, görsel testler, e2e
```

---

## 11. Yol haritası

### Faz 1: Çekirdek (MVP)
- Veri modeli ve tüm bölümler (3. madde eksiksiz)
- Editör + canlı önizleme + otomatik kaydetme + geri al/yinele
- 3 şablon (Klasik, Modern, Kompakt)
- Tam tasarım paneli: renk, font, tüm puntolar, boşluklar, kenar boşlukları, bölüm sırası
- PDF dışa aktarım (Türkçe çıkarım testleri dahil)
- TR/EN CV dili
- JSON içe/dışa aktarım
- Birden fazla CV, çoğaltma
- Uluslararası mod
- Ana sayfa + gizlilik/KVKK sayfaları

### Faz 2: Fark yaratanlar
- "ATS'nin gözünden" paneli
- CV kalite denetimi ve puanı
- İlan eşleştirme
- DOCX ve TXT dışa aktarım
- Kalan 3 şablon
- Ön yazı oluşturucu
- Tek sayfaya sığdır
- LinkedIn PDF içe aktarma
- Sürüm geçmişi
- PWA (çevrimdışı çalışma)

### Faz 3: Büyüme
- İsteğe bağlı hesap + şifreli senkron
- Paylaşılabilir CV bağlantısı
- Yapay zekâ yardımcısı (madde iyileştirme, özet yazma, İngilizceye çeviri), isteğe bağlı ve açık rızayla
- Kariyer danışmanı paneli (çok kullanıcılı)
- Mevcut PDF/DOCX CV'yi ayrıştırarak içe aktarma

---

## 12. Kalite güvencesi
- **Türkçe karakter testi**: Her şablon × her font için PDF üret → pdf.js ve `pdftotext` ile metni geri çıkar → birebir karşılaştır
- **ATS ayrıştırıcı testi**: Açık kaynak CV ayrıştırıcılarla (ör. pyresparser, OpenResume parser) ad, e-posta, telefon, deneyim ve eğitimin doğru alanlara düştüğünü doğrula
- **Görsel regresyon**: Şablon değişikliklerinde PDF görüntüsü karşılaştırması
- **Uç durumlar**: Çok uzun şirket adı, 20 deneyim, boş bölümler, emoji, sağdan sola metin, 3 sayfalık CV
- **Erişilebilirlik**: Klavye, ekran okuyucu, kontrast (axe testleri)
- **Performans**: Önizleme güncellemesi < 200 ms, ilk yükleme < 3 sn (önbellekli < 1 sn)
- **Tarayıcılar**: Chrome, Edge, Firefox, Safari, mobil Safari ve Chrome

---

## 13. Yayın ve büyüme
- Alan adı ve marka adı (önerilir: kısa, Türkçe-İngilizce okunabilir)
- SEO: "ATS uyumlu CV", "ücretsiz CV oluştur", "askerlik durumu CV'ye nasıl yazılır" gibi rehber içerikleri
- Örnek CV galerisi (meslek bazında: bilgi işlem, yazılım, muhasebe, satış…)
- Gelir modeli (isteğe bağlı, temel her şey ücretsiz kalır): bağış, Faz 3'te yapay zekâ özellikleri veya danışman paneli için ücretli plan

---

## 14. Netleşmesi gereken kararlar
1. **PDF motoru**: Typst-WASM (tarayıcıda, sunucusuz) mı, Chromium (sunucuda) mı? Öneri: Typst-WASM.
2. **Hesap sistemi**: Faz 1'de tamamen hesapsız mı başlayalım? Öneri: Evet.
3. **Ürün adı ve alan adı**
4. **Arayüz dili**: Yalnız Türkçe mi, Türkçe + İngilizce mi? Öneri: İkisi birden (CV dili zaten iki dilli).
