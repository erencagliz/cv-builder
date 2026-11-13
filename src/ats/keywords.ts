import type { CV } from '../model/types';
import { totalExperienceMonths } from './quality';

const lower = (t: string) => t.toLocaleLowerCase('tr-TR').replace(/ı/g, 'i');

const REQUIREMENT_TERMS = new Set(['ehliyet', 'b sinifi ehliyet', 'askerlik', 'seyahat engeli', 'ingilizce', 'almanca', 'fransizca', 'arapça', 'rusça']);

const DICTIONARY = `
active directory|group policy|windows server|microsoft 365|office 365|exchange server|exchange online|azure ad|entra id|intune|sccm|mecm|wsus|dhcp|dns|tcp/ip|vlan|vpn|firewall|fortigate|palo alto|cisco|ccna|ccnp|mcsa|mcse|itil|comptia|vmware|vsphere|esxi|hyper-v|proxmox|veeam|backup|yedekleme|linux|ubuntu|centos|red hat|bash|powershell|python|java|javascript|typescript|c#|c++|.net|asp.net|node.js|react|angular|vue|next.js|html|css|sass|tailwind|php|laravel|symfony|go|golang|rust|kotlin|swift|flutter|react native|django|flask|spring|spring boot|sql|t-sql|pl/sql|mysql|postgresql|mssql|sql server|oracle|mongodb|redis|elasticsearch|kafka|rabbitmq|docker|kubernetes|helm|terraform|ansible|jenkins|gitlab ci|github actions|ci/cd|devops|aws|azure|google cloud|gcp|git|jira|confluence|scrum|agile|kanban|rest|rest api|graphql|microservices|mikroservis|unit test|birim test|tdd|oop|nesne yönelimli|design patterns|tasarım desenleri|clean code|figma|adobe xd|photoshop|illustrator|indesign|after effects|premiere|blender|unity|unreal|roblox|lua|autocad|solidworks|catia|revit|sketchup|3ds max|matlab|plc|scada|power bi|tableau|qlik|excel|ileri excel|makro|vba|pivot|sap|sap fi|sap mm|sap sd|logo|netsis|mikro|luca|eta|erp|crm|salesforce|hubspot|seo|sem|google ads|meta ads|google analytics|e-ticaret|e-commerce|dijital pazarlama|sosyal medya|içerik pazarlaması|ön muhasebe|genel muhasebe|maliyet muhasebesi|bordro|e-fatura|e-defter|e-arşiv|kdv|beyanname|mutabakat|bütçe|raporlama|finansal analiz|dış ticaret|ithalat|ihracat|gümrük|lojistik|tedarik zinciri|satın alma|stok yönetimi|depo yönetimi|insan kaynakları|işe alım|performans yönetimi|eğitim planlama|müşteri ilişkileri|müşteri hizmetleri|çağrı merkezi|satış|b2b|b2c|kurumsal satış|saha satış|proje yönetimi|pmp|prince2|iş analizi|veri analizi|makine öğrenmesi|machine learning|deep learning|derin öğrenme|yapay zeka|nlp|computer vision|pandas|numpy|scikit-learn|tensorflow|pytorch|istatistik|iso 9001|iso 27001|iso 14001|kvkk|gdpr|iş güvenliği|isg|6 sigma|six sigma|lean|yalın üretim|kalite kontrol|ar-ge|teknik resim|ingilizce|almanca|fransızca|arapça|rusça|ehliyet|b sınıfı ehliyet|askerlik|seyahat engeli|vardiya|takım çalışması|iletişim becerisi|problem çözme|analitik düşünme|liderlik|sunum|ms office|word|powerpoint|outlook|teams|sharepoint|onedrive|google workspace|help desk|helpdesk|son kullanıcı desteği|teknik destek|donanım|yazıcı|ip telefon|network|ağ yönetimi|sistem yönetimi|sunucu|siber güvenlik|penetrasyon testi|siem|soc|antivirüs|endpoint|mdm|bulut|cloud|sanallaştırma|redux|mobx|zustand|jest|vitest|cypress|playwright|selenium|webpack|vite|storybook|design system|tasarım sistemi|nuxt|svelte|express|nestjs|fastapi|prisma|supabase|firebase|android|ios|xamarin|wordpress|shopify|magento|ui/ux|ux|ui|a/b test|kpi|okr|bigquery|snowflake|databricks|spark|hadoop|airflow|etl|data warehouse|veri ambarı|nginx|apache|iis|zabbix|grafana|prometheus|nagios|splunk|wireshark|okta|keycloak|oauth|sso|ldap|radius|wi-fi|wifi|lan|wan|sd-wan|mpls|ospf|bgp|switch|router|kesintisiz güç kaynağı|ups|cctv|pbx|voip|3cx
`
  .trim()
  .split('|')
  .map((t) => lower(t.trim()))
  .filter(Boolean)
  .filter((t) => !REQUIREMENT_TERMS.has(t))
  .sort((a, b) => b.length - a.length);

const STOP_TR = new Set(
  `ve veya ile ya da için gibi kadar daha en çok az bir bu şu o da de ki mi mı mu mü ne her hem ise olan olarak olan olmak olması olup olduğu oldukça
  ama fakat ancak çünkü eğer yani üzere göre karşı sonra önce arasında içinde üzerinde altında ayrıca ilgili konusunda konularında alanında
  bizim biz siz sizin onların bunlar şunlar bunu şunu onu tüm bütün bazı birçok çeşitli diğer aynı yeni iyi yüksek düşük büyük küçük
  aday adaylar adayın adayımızın arkadaş arkadaşlar arıyoruz aranıyor aramaktayız alınacaktır istihdam edilmek edilecek pozisyon pozisyonu pozisyonumuz
  görev görevler görevleri tanımı sorumluluklar sorumluluk nitelikler nitelik genel aranan şartlar şart beklenen beklentiler tercih tercihen tercihimizdir
  sebebi sebep sahip sahibi deneyimli deneyim deneyimi tecrübe tecrübeli tecrübesi yıl yıllık en az minimum asgari bilgi bilgisi bilgisine bilgili
  derecede seviyede seviyesinde iyi düzeyde yetkin yetkinliği yetkinlik becerisi becerileri yeteneği yetenekli tam zamanlı yarı firma firmamız şirket
  şirketimiz şirketimizde bünyesinde bünyemizde ekip ekibimize ekibimizde ekibine takım çalışma çalışabilecek çalışacak çalışmak işi iş işler işlerin
  yapmak yapabilecek yapacak yürütmek yürütecek sağlamak sağlayacak takip takibi etmek edecek edebilecek olmayan bulunmayan bulunan konu konular
  lokasyon lokasyonunda merkez merkezimizde ofis ofisimizde ilanı ilan başvuru başvurular başvurunuz başvurmak hakkında detaylı kapsamında dahilinde
  mezun mezunu üniversite üniversitelerin bölüm bölümlerinden lisans önlisans ön lisans erkek kadın bay bayan adaylar için yaşında yaş
  bilen bilmek bilgisi hakim hakimiyeti kullanmış kullanabilen kullanan yapabilen yapan tamamlamış sahibi uzman uzmanı uzmanlığı yönetim yönetimi
  yönetimini yönetiminde süreç süreçleri süreçlerine süreçlerinde konularında alanlarında platform platformları platformlarında görevlendirilmek
  ilgili gerekli gereken önemli aktif etkin hızlı başarılı dinamik motivasyonu yüksek istekli sorumluluk sahibi talebi talepleri taleplerinin
  çözümü çözüm katkı sunacak sunmak kurum kurumsal`
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.toLocaleLowerCase('tr-TR').replace(/ı/g, 'i')),
);
const STOP_EN = new Set(
  `a an the and or of to in on at for with by from as is are be been being was were will would can could should must may might this that these those
  it its we our you your they their he she his her who whom which what when where why how all any both each few more most other some such no nor not
  only own same so than too very just also into over under about after before between through during within without upon per via etc
  job role position candidate candidates team company we're looking seeking hiring join apply responsibilities requirements qualifications preferred
  plus required ideal strong excellent good great ability able experience experienced years year minimum least knowledge understanding skills skill
  working work works environment opportunity opportunities including include includes new well based full time part day days`
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.toLowerCase()),
);

export function stemTr(word: string): string {
  let w = word.replace(/['’].*$/, '');
  const suffixes = ['larından', 'lerinden', 'larında', 'lerinde', 'larına', 'lerine', 'ları', 'leri', 'ların', 'lerin', 'lar', 'ler', 'ından', 'inden', 'undan', 'ünden', 'ında', 'inde', 'unda', 'ünde', 'ına', 'ine', 'una', 'üne', 'nın', 'nin', 'nun', 'nün', 'dan', 'den', 'tan', 'ten', 'da', 'de', 'ta', 'te', 'ını', 'ini', 'unu', 'ünü', 'sı', 'si', 'su', 'sü', 'ı', 'i', 'u', 'ü'];
  for (let pass = 0; pass < 2; pass++) {
    for (const suf of suffixes) {
      if (w.length - suf.length >= 4 && w.endsWith(suf)) {
        w = w.slice(0, -suf.length);
        break;
      }
    }
  }
  return w;
}

export interface Keyword {
  term: string;
  key: string;
  kind: 'title' | 'dictionary' | 'tech' | 'frequent';
  count: number;
}

const PLACES = new Set(['istanbul', 'ankara', 'izmir', 'bursa', 'antalya', 'kocaeli', 'konya', 'adana', 'gaziantep', 'türkiye', 'turkey', 'avrupa', 'anadolu', 'remote', 'hybrid', 'senior', 'junior', 'mid', 'lead', 'we', 'our', 'the', 'this', 'you', 'familiarity', 'excellent', 'experience', 'requirements', 'responsibilities', 'english', 'ingilizce', 'bilgisayar', 'turkish', 'german', 'company', 'genel', 'nitelikler', 'tanimi']);

const tokenRe = /[\p{L}\p{N}][\p{L}\p{N}+#./-]*[\p{L}\p{N}+#]|[\p{L}\p{N}]/gu;

export function extractKeywords(ad: string, limit = 30): Keyword[] {
  const text = ad.replace(/\r/g, '');
  const low = lower(text);
  const found = new Map<string, Keyword>();
  const add = (key: string, term: string, kind: Keyword['kind'], count = 1) => {
    const cur = found.get(key);
    if (cur) cur.count += count;
    else found.set(key, { key, term, kind, count });
  };
  let masked = low;
  const firstLine = text.split('\n').map((l) => l.trim()).find(Boolean) ?? '';
  if (firstLine && firstLine.length <= 60 && firstLine.split(/\s+/).length <= 6 && !/[.:;]$/.test(firstLine)) {
    add(lower(firstLine), firstLine, 'title', 1);
    masked = masked.split(lower(firstLine)).join(' ');
  }
  for (const term of DICTIONARY) {
    const esc = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(^|[^\\p{L}\\p{N}])${esc}(?=$|[^\\p{L}\\p{N}+#])`, 'gu');
    const n = (masked.match(re) || []).length;
    if (n) {
      add(term, prettyTerm(term, text), 'dictionary', n);
      masked = masked.replace(re, '$1 ');
    }
  }
  const orig = text.match(tokenRe) ?? [];
  for (const tok of orig) {
    const clean = tok.replace(/['’].*$/, '').replace(/[.,;:]+$/, '');
    if (clean.length < 2) continue;
    const l = lower(clean);
    if (STOP_TR.has(l) || STOP_EN.has(l) || /^\d+$/.test(clean)) continue;
    if (!masked.includes(l)) continue;
    if (/^\d+[+%]?$/.test(clean) || PLACES.has(l)) continue;
    const techy = /[a-zçğıöşü][A-ZÇĞİÖŞÜ]/.test(clean) || /^[A-ZÇĞİÖŞÜ0-9+#./-]{2,}$/.test(clean) || /[+#]|\d/.test(clean) || /\.[a-z]{2,}$/i.test(clean);
    if (techy) add(l, clean, 'tech');
  }
  const properRe = /(?<![.!?:\n•\-–*]\s*)(?<=\s)([A-ZÇĞİÖŞÜ][a-zçğıöşü]{2,}[A-Za-z0-9]*)/gu;
  for (const m of text.matchAll(properRe)) {
    const w = m[1];
    const l = lower(w);
    if (STOP_TR.has(l) || STOP_EN.has(l) || PLACES.has(l) || !masked.includes(l) || found.has(l)) continue;
    if (/[çğıöşü]/i.test(w)) continue;
    add(l, w, 'tech');
  }
  const counts = new Map<string, { n: number; sample: string }>();
  for (const tok of masked.match(tokenRe) ?? []) {
    const l = tok.replace(/['’].*$/, '');
    if (l.length < 4 || STOP_TR.has(l) || STOP_EN.has(l) || /^\d+$/.test(l)) continue;
    const st = stemTr(l);
    if (STOP_TR.has(st) || st.length < 4) continue;
    const c = counts.get(st) ?? { n: 0, sample: l };
    c.n++;
    counts.set(st, c);
  }
  for (const [st, c] of counts) if (c.n >= 2 && !found.has(st) && ![...found.keys()].some((k) => k.includes(st))) add(st, c.sample, 'frequent', c.n);

  const rank = (k: Keyword) => (k.kind === 'title' ? 1000 : k.kind === 'dictionary' ? 100 : k.kind === 'tech' ? 60 : 0) + k.count * 5;
  return [...found.values()].sort((a, b) => rank(b) - rank(a)).slice(0, limit);
}

function prettyTerm(term: string, original: string): string {
  const i = lower(original).indexOf(term);
  return i >= 0 ? original.slice(i, i + term.length) : term;
}

export function cvHas(cvText: string, k: Keyword): boolean {
  const low = lower(cvText);
  if (low.includes(k.key)) return true;
  if (k.kind === 'frequent') {
    const stem = k.key;
    return (low.match(tokenRe) ?? []).some((t) => t.startsWith(stem));
  }
  return false;
}

export interface MatchResult {
  keywords: (Keyword & { found: boolean })[];
  score: number;
  requirements: { level: 'ok' | 'warn' | 'info'; text: string }[];
}

export function matchJob(ad: string, cvText: string, cv: CV): MatchResult {
  const kws = extractKeywords(ad).map((k) => ({ ...k, found: cvHas(cvText, k) }));
  const weight = (k: Keyword) => (k.kind === 'title' ? 3 : k.kind === 'dictionary' ? 3 : k.kind === 'tech' ? 2 : 1);
  const total = kws.reduce((n, k) => n + weight(k), 0);
  const got = kws.filter((k) => k.found).reduce((n, k) => n + weight(k), 0);
  const requirements: MatchResult['requirements'] = [];
  const low = lower(ad);
  const yr = /(?:en az|minimum|asgari|min\.?|at least)\s*(\d{1,2})\s*\+?\s*(?:y[ıi]l|sene|years?)|(\d{1,2})\s*\+\s*(?:y[ıi]l|years?)|(\d{1,2})\s*(?:y[ıi]l|sene)\s*(?:ve üzeri|deneyim|tecrübe)/i.exec(low);
  if (yr) {
    const need = parseInt(yr[1] || yr[2] || yr[3], 10);
    const have = totalExperienceMonths(cv) / 12;
    requirements.push(
      have + 0.01 >= need
        ? { level: 'ok', text: `İlan en az ${need} yıl deneyim istiyor; CV’ndeki toplam deneyim yaklaşık ${have.toFixed(1).replace('.', ',')} yıl.` }
        : { level: 'warn', text: `İlan en az ${need} yıl deneyim istiyor; CV’nde yaklaşık ${have.toFixed(1).replace('.', ',')} yıl görünüyor. Staj ve projeleri de eklemeyi düşün.` },
    );
  }
  if (/ehliyet|sürücü belgesi|driver'?s licen/.test(low)) {
    requirements.push(
      cv.personal.licenses.length
        ? { level: 'ok', text: `İlan ehliyet istiyor; CV’nde ${cv.personal.licenses.join(', ')} sınıfı ehliyet var.` }
        : { level: 'warn', text: 'İlan ehliyet istiyor ama CV’nde ehliyet bilgisi yok (Profil → Kişisel Bilgiler).' },
    );
  }
  if (/askerlik|military service/.test(low)) {
    requirements.push(
      cv.personal.military
        ? { level: 'ok', text: 'İlan askerlik durumunu soruyor; CV’nde belirtilmiş.' }
        : { level: 'warn', text: 'İlan askerlik durumunu soruyor ama CV’nde yok.' },
    );
  }
  if (/seyahat engeli|seyahat edebilecek|travel/.test(low) && !cv.personal.travel)
    requirements.push({ level: 'info', text: 'İlanda seyahat şartı geçiyor; seyahat engeli durumunu belirtebilirsin.' });
  const eng = /ingilizce|english/.test(low);
  if (eng && !cv.sections.languages.some((l) => /ingilizce|english/.test(lower(String(l.language ?? '')))))
    requirements.push({ level: 'warn', text: 'İlan İngilizce istiyor ama Diller bölümünde İngilizce yok.' });
  return { keywords: kws, score: total ? Math.round((got / total) * 100) : 0, requirements };
}
