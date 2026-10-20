// İkon setini src/render/icons.json'a gömer.
// Genel ikonlar: Lucide (ISC) · Marka logoları: Simple Icons (CC0)
// Kullanım: node scripts/build-icons.mjs <lucide-static/icons klasörü> <simple-icons/icons klasörü>
import fs from 'fs';
const [lucideDir, simpleDir] = process.argv.slice(2);
const GENERIC = {
  // id: Türkçe ad
  'briefcase': 'Çanta', 'briefcase-business': 'İş', 'building-2': 'Bina', 'graduation-cap': 'Kep', 'school': 'Okul',
  'book-open': 'Kitap', 'library': 'Kütüphane', 'wrench': 'Anahtar', 'hammer': 'Çekiç', 'settings': 'Ayarlar',
  'code': 'Kod', 'terminal': 'Terminal', 'laptop': 'Dizüstü', 'monitor': 'Monitör', 'server': 'Sunucu',
  'network': 'Ağ', 'cpu': 'İşlemci', 'database': 'Veritabanı', 'shield-check': 'Güvenlik', 'printer': 'Yazıcı',
  'headphones': 'Destek', 'smartphone': 'Telefon', 'languages': 'Diller', 'globe': 'Dünya', 'message-square': 'Mesaj',
  'award': 'Ödül', 'badge-check': 'Onaylı', 'medal': 'Madalya', 'trophy': 'Kupa', 'star': 'Yıldız',
  'folder': 'Klasör', 'folder-git-2': 'Proje', 'layers': 'Katmanlar', 'rocket': 'Roket', 'lightbulb': 'Fikir',
  'target': 'Hedef', 'chart-line': 'Grafik', 'chart-column': 'Sütun grafik', 'clipboard-list': 'Liste', 'list-checks': 'Yapılacaklar',
  'heart-handshake': 'Gönüllülük', 'handshake': 'Tokalaşma', 'heart': 'Kalp', 'users': 'Topluluk', 'user': 'Kişi',
  'user-round': 'Profil', 'user-check': 'Referans', 'id-card': 'Kimlik', 'file-text': 'Belge', 'newspaper': 'Yayın',
  'mic': 'Mikrofon', 'presentation': 'Sunum', 'quote': 'Alıntı', 'pen-tool': 'Tasarım', 'palette': 'Palet',
  'camera': 'Kamera', 'music': 'Müzik', 'gamepad-2': 'Oyun', 'dumbbell': 'Spor', 'plane': 'Seyahat',
  'compass': 'Pusula', 'leaf': 'Doğa', 'coffee': 'Kahve', 'puzzle': 'Yapboz', 'sparkles': 'Işıltı',
  'zap': 'Enerji', 'scale': 'Hukuk', 'stethoscope': 'Sağlık', 'landmark': 'Kurum', 'car': 'Araç',
  'calendar': 'Takvim', 'clock': 'Saat', 'flag': 'Bayrak', 'map-pin': 'Konum', 'phone': 'Telefon (sabit)',
  'mail': 'E-posta', 'link': 'Bağlantı', 'house': 'Ev',
};
const BRANDS = {
  linkedin: 'linkedin', github: 'github', gitlab: 'gitlab', behance: 'behance', dribbble: 'dribbble', medium: 'medium',
  stackoverflow: 'stackoverflow', kaggle: 'kaggle', youtube: 'youtube', x: 'x', instagram: 'instagram',
  artstation: 'artstation', scholar: 'googlescholar', orcid: 'orcid', itchio: 'itchdotio', roblox: 'roblox', npm: 'npm',
};
const out = { generic: {}, brands: {}, labels: {} };
const inner = (svg) => svg.replace(/<!--[\s\S]*?-->/g, '').replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/\s+/g, ' ').trim();
const missing = [];
for (const [id, label] of Object.entries(GENERIC)) {
  const f = `${lucideDir}/${id}.svg`;
  if (!fs.existsSync(f)) { missing.push(id); continue; }
  out.generic[id] = inner(fs.readFileSync(f, 'utf8'));
  out.labels[id] = label;
}
for (const [id, file] of Object.entries(BRANDS)) {
  const f = `${simpleDir}/${file}.svg`;
  if (!fs.existsSync(f)) { missing.push(file); continue; }
  out.brands[id] = inner(fs.readFileSync(f, 'utf8')).replace(/<title>.*?<\/title>/, '');
}
fs.writeFileSync(new URL('../src/render/icons.json', import.meta.url), JSON.stringify(out));
console.log('generic', Object.keys(out.generic).length, 'brands', Object.keys(out.brands).length, 'missing', missing);
