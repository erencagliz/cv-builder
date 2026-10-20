/**
 * Meslek bazlı örnek içerik. Maddelerdeki [köşeli parantezli] kısımlar kullanıcının kendi rakamıyla değiştirmesi içindir.
 * Örnek kişiler kurgusaldır.
 */
export interface Profession {
  id: string;
  name: string; // galeri ve seçici adı
  title: string; // CV unvanı
  summary: string;
  bullets: string[];
  skills: { name: string; items: string[] }[];
  sample: {
    firstName: string;
    lastName: string;
    city: string;
    jobs: { position: string; company: string; start: string; end: string; current?: boolean; bullets: number[] }[];
    school: string;
    degree: 'highschool' | 'associate' | 'bachelor' | 'master';
    field: string;
    eduStart: string;
    eduEnd: string;
    certificates?: { name: string; issuer: string; date: string }[];
  };
}

export const PROFESSIONS: Profession[] = [
  {
    id: 'it-support',
    name: 'Bilgi İşlem / IT Destek',
    title: 'Bilgi İşlem Uzmanı',
    summary:
      '[5] yıllık deneyime sahip Bilgi İşlem Uzmanı. [200] kullanıcılı yapılarda Active Directory, son kullanıcı desteği ve ağ altyapısını yönettim. Tekrarlayan işleri otomatikleştirerek destek yükünü azaltmaya odaklanıyorum.',
    bullets: [
      '[250] kullanıcılı Active Directory ve Group Policy yapısını yönettim; hesap açılış süresini [1 günden 2 saate] indirdim.',
      'PowerShell betikleriyle yazılım dağıtımını otomatikleştirerek aylık destek taleplerini %[35] azalttım.',
      'Günlük ortalama [30] son kullanıcı talebini SLA süreleri içinde çözdüm.',
      '[3] lokasyonda yazıcı, IP telefon ve çevre birimlerinin kurulum ve bakımını yürüttüm.',
      'Yedekleme politikasını yeniden kurguladım; aylık geri dönüş testleriyle veri kaybı riskini ortadan kaldırdım.',
      'Envanter takibini Excel’den GLPI sistemine taşıyarak [400] cihazı tek ekrandan izlenir hâle getirdim.',
      'Fortigate güvenlik duvarında VPN ve erişim kurallarını düzenleyerek uzaktan çalışmaya [2 haftada] geçişi sağladım.',
      'Yeni personele bilgi güvenliği eğitimi vererek kimlik avı (phishing) testlerindeki tıklama oranını %[40] düşürdüm.',
    ],
    skills: [
      { name: 'Sistem', items: ['Active Directory', 'Group Policy', 'Windows Server', 'Microsoft 365', 'Intune'] },
      { name: 'Ağ', items: ['TCP/IP', 'DHCP', 'DNS', 'VLAN', 'Fortigate', 'VPN'] },
      { name: 'Araçlar', items: ['PowerShell', 'GLPI', 'Veeam', 'VMware vSphere'] },
    ],
    sample: {
      firstName: 'Deniz',
      lastName: 'Yılmaz',
      city: 'Ataşehir, İstanbul',
      jobs: [
        { position: 'Bilgi İşlem Uzmanı', company: 'Anka Lojistik A.Ş.', start: '2022-03', end: '', current: true, bullets: [0, 1, 3, 4] },
        { position: 'IT Destek Uzmanı', company: 'Mavi Yazılım', start: '2019-07', end: '2022-02', bullets: [2, 5] },
      ],
      school: 'Marmara Üniversitesi',
      degree: 'associate',
      field: 'Bilgisayar Programcılığı',
      eduStart: '2017-09',
      eduEnd: '2019-06',
      certificates: [{ name: 'CCNA', issuer: 'Cisco', date: '2021-11' }],
    },
  },
  {
    id: 'software',
    name: 'Yazılım Geliştirici',
    title: 'Full Stack Yazılım Geliştirici',
    summary:
      'Web uygulamalarında [4] yıllık deneyime sahip Full Stack Geliştirici. React ve Node.js ile ölçeklenebilir ürünler geliştiriyor, test ve kod kalitesine önem veriyorum.',
    bullets: [
      'React ve TypeScript ile [40] ekrandan oluşan yönetim panelini sıfırdan geliştirdim.',
      'Node.js tabanlı REST API’nin yanıt süresini önbellekleme ile %[60] kısalttım.',
      'Birim test kapsamını %[20]’den %[75]’e çıkararak canlıya çıkan hata sayısını yarıya indirdim.',
      'CI/CD hattını GitHub Actions ile kurarak dağıtım süresini [45 dakikadan 8 dakikaya] düşürdüm.',
      'PostgreSQL sorgularını indeksleyerek raporlama ekranının yüklenme süresini [12 saniyeden 1 saniyeye] indirdim.',
      '[3] kişilik ekibe kod incelemesi ve mentorluk yaparak yeni geliştiricilerin uyum süresini kısalttım.',
      'Ödeme altyapısını entegre ederek ayda [10.000]’den fazla işlemin sorunsuz yürümesini sağladım.',
      'Erişilebilirlik iyileştirmeleriyle Lighthouse skorunu [62]’den [95]’e yükselttim.',
    ],
    skills: [
      { name: 'Diller', items: ['TypeScript', 'JavaScript', 'C#', 'SQL'] },
      { name: 'Frontend', items: ['React', 'Next.js', 'HTML', 'CSS', 'Tailwind'] },
      { name: 'Backend', items: ['Node.js', '.NET', 'PostgreSQL', 'Redis', 'REST', 'GraphQL'] },
      { name: 'Araçlar', items: ['Git', 'Docker', 'GitHub Actions', 'Jira'] },
    ],
    sample: {
      firstName: 'Ece',
      lastName: 'Kaya',
      city: 'Kadıköy, İstanbul',
      jobs: [
        { position: 'Full Stack Geliştirici', company: 'Pusula Teknoloji', start: '2023-01', end: '', current: true, bullets: [0, 1, 3, 6] },
        { position: 'Yazılım Geliştirici', company: 'Nokta Dijital', start: '2021-02', end: '2022-12', bullets: [2, 4] },
      ],
      school: 'Yıldız Teknik Üniversitesi',
      degree: 'bachelor',
      field: 'Bilgisayar Mühendisliği',
      eduStart: '2016-09',
      eduEnd: '2021-06',
    },
  },
  {
    id: 'accounting',
    name: 'Muhasebe',
    title: 'Muhasebe Uzmanı',
    summary:
      'Genel muhasebe, vergi beyannameleri ve e-dönüşüm süreçlerinde [6] yıllık deneyime sahip Muhasebe Uzmanı. Kapanış sürelerini kısaltan ve hatasız raporlama sağlayan süreçler kurarım.',
    bullets: [
      'Aylık kapanış sürecini yeniden düzenleyerek kapanış süresini [10 günden 4 güne] indirdim.',
      'KDV, muhtasar ve geçici vergi beyannamelerini [6] yıl boyunca zamanında ve cezasız hazırladım.',
      'e-Fatura, e-Arşiv ve e-Defter geçişini yöneterek kâğıt ve kargo maliyetini yılda [120.000 TL] azalttım.',
      '[300]’den fazla cari hesabın mutabakatını yaparak açık bakiyeleri %[80] azalttım.',
      'Logo ERP’de maliyet merkezleri kurarak yönetime aylık kârlılık raporu sundum.',
      'Bağımsız denetimlerde istenen belgeleri hazırlayarak denetimin bulgusuz tamamlanmasını sağladım.',
      '[45] çalışanın bordrosunu SGK ve vergi mevzuatına uygun şekilde hazırladım.',
      'Banka mutabakatlarını Excel makrolarıyla otomatikleştirerek haftada [6 saat] tasarruf sağladım.',
    ],
    skills: [
      { name: 'Muhasebe', items: ['Genel muhasebe', 'Ön muhasebe', 'Maliyet muhasebesi', 'Bordro', 'Beyanname'] },
      { name: 'Yazılım', items: ['Logo', 'Netsis', 'SAP FI', 'İleri Excel'] },
      { name: 'Mevzuat', items: ['VUK', 'TFRS', 'e-Fatura', 'e-Defter'] },
    ],
    sample: {
      firstName: 'Selin',
      lastName: 'Arslan',
      city: 'Çankaya, Ankara',
      jobs: [
        { position: 'Muhasebe Uzmanı', company: 'Kuzey Gıda San. A.Ş.', start: '2021-05', end: '', current: true, bullets: [0, 2, 4, 5] },
        { position: 'Muhasebe Elemanı', company: 'Akın Mali Müşavirlik', start: '2018-09', end: '2021-04', bullets: [1, 6] },
      ],
      school: 'Hacettepe Üniversitesi',
      degree: 'bachelor',
      field: 'İşletme',
      eduStart: '2014-09',
      eduEnd: '2018-06',
      certificates: [{ name: 'SMMM Staj Başlama', issuer: 'TÜRMOB', date: '2019-03' }],
    },
  },
  {
    id: 'sales',
    name: 'Satış',
    title: 'Kurumsal Satış Uzmanı',
    summary:
      'B2B satışta [5] yıllık deneyime sahip Satış Uzmanı. Yeni müşteri kazanımı, teklif süreçleri ve uzun vadeli müşteri ilişkileri konusunda hedeflerin üzerinde sonuç aldım.',
    bullets: [
      'Yıllık satış hedefini üst üste [3] yıl %[115] ve üzerinde gerçekleştirdim.',
      '[40] yeni kurumsal müşteri kazandırarak bölge cirosunu %[28] büyüttüm.',
      'CRM’de satış hunisini düzenleyerek teklif–sipariş dönüşüm oranını %[18]’den %[27]’ye çıkardım.',
      '[1,2 milyon TL] değerinde yıllık çerçeve anlaşmasını müzakere ederek imzaladım.',
      'Müşteri ziyaret planlamasını yeniden kurgulayarak ziyaret başına maliyeti %[20] düşürdüm.',
      'Yeni ürün lansmanı için bayilere [12] eğitim düzenleyerek ilk çeyrekte [900] adet satış sağladım.',
      'Kayıp müşteri analizine göre geri kazanım kampanyası yürütüp [15] müşteriyi geri kazandım.',
      '[4] kişilik satış ekibine saha koçluğu yaparak ekip hedefinin %[108] gerçekleşmesine katkı verdim.',
    ],
    skills: [
      { name: 'Satış', items: ['B2B satış', 'Müzakere', 'Teklif hazırlama', 'Müşteri ilişkileri', 'Saha satış'] },
      { name: 'Araçlar', items: ['Salesforce', 'HubSpot', 'Excel', 'Power BI'] },
    ],
    sample: {
      firstName: 'Burak',
      lastName: 'Demir',
      city: 'Bornova, İzmir',
      jobs: [
        { position: 'Kurumsal Satış Uzmanı', company: 'Ege Endüstri Ltd.', start: '2021-01', end: '', current: true, bullets: [0, 1, 3, 2] },
        { position: 'Satış Temsilcisi', company: 'Delta Ofis Çözümleri', start: '2019-03', end: '2020-12', bullets: [4, 5] },
      ],
      school: 'Dokuz Eylül Üniversitesi',
      degree: 'bachelor',
      field: 'İktisat',
      eduStart: '2014-09',
      eduEnd: '2019-01',
    },
  },
  {
    id: 'marketing',
    name: 'Dijital Pazarlama',
    title: 'Dijital Pazarlama Uzmanı',
    summary:
      'Performans pazarlaması, SEO ve içerik stratejisinde [4] yıllık deneyime sahip Dijital Pazarlama Uzmanı. Ölçülebilir büyüme hedefleyen veri odaklı kampanyalar yönetirim.',
    bullets: [
      'Google Ads ve Meta Ads kampanyalarında aylık [400.000 TL] bütçeyi yöneterek ROAS’ı [2,1]’den [3,4]’e çıkardım.',
      'SEO çalışmalarıyla organik trafiği [12 ayda] %[160] artırdım.',
      'E-posta otomasyonları kurarak sepet terk dönüşümünü %[22] yükselttim.',
      'A/B testleriyle açılış sayfası dönüşüm oranını %[1,8]’den %[3,1]’e çıkardım.',
      'Instagram hesabını [8 ayda] [12 bin]’den [65 bin] takipçiye büyüttüm.',
      'Google Analytics 4 ve Looker Studio ile yönetime haftalık performans panosu hazırladım.',
      '[5] influencer iş birliği planlayarak lansman haftasında [3.000] yeni üye kazandırdım.',
      'Ajans süreçlerini içeri alarak yıllık pazarlama maliyetini %[25] azalttım.',
    ],
    skills: [
      { name: 'Pazarlama', items: ['SEO', 'SEM', 'Google Ads', 'Meta Ads', 'E-posta pazarlama', 'İçerik pazarlaması'] },
      { name: 'Analiz', items: ['Google Analytics 4', 'Looker Studio', 'A/B testi'] },
      { name: 'Araçlar', items: ['HubSpot', 'Figma', 'Canva', 'WordPress'] },
    ],
    sample: {
      firstName: 'Zeynep',
      lastName: 'Çelik',
      city: 'Beşiktaş, İstanbul',
      jobs: [
        { position: 'Dijital Pazarlama Uzmanı', company: 'Kumbara E-Ticaret', start: '2022-06', end: '', current: true, bullets: [0, 1, 3, 5] },
        { position: 'Sosyal Medya Uzmanı', company: 'Pera Ajans', start: '2020-09', end: '2022-05', bullets: [4, 6] },
      ],
      school: 'Galatasaray Üniversitesi',
      degree: 'bachelor',
      field: 'İletişim',
      eduStart: '2016-09',
      eduEnd: '2020-06',
    },
  },
  {
    id: 'hr',
    name: 'İnsan Kaynakları',
    title: 'İnsan Kaynakları Uzmanı',
    summary:
      'İşe alım, performans yönetimi ve çalışan deneyimi alanlarında [5] yıllık deneyime sahip İK Uzmanı. Süreçleri ölçen ve iyileştiren, çalışan bağlılığını artıran uygulamalar geliştiririm.',
    bullets: [
      'Yılda [120]’den fazla pozisyonun işe alım sürecini uçtan uca yönettim.',
      'Ortalama işe alım süresini [45 günden 28 güne] indirdim.',
      'Oryantasyon programını yeniden tasarlayarak ilk 6 aydaki işten ayrılma oranını %[30] azalttım.',
      'Yetkinlik bazlı performans sistemi kurarak [350] çalışanın değerlendirmesini dijitale taşıdım.',
      'Çalışan bağlılığı anketi sonuçlarına göre aksiyon planı yürüterek bağlılık skorunu [12] puan artırdım.',
      'Üniversitelerle staj programı kurarak [25] stajyerden [9]’unu kadroya kazandırdım.',
      'İK politikalarını İş Kanunu ve KVKK’ya uygun hâle getirdim.',
      'Bordro ve özlük süreçlerini İK yazılımına taşıyarak manuel iş yükünü haftada [10 saat] azalttım.',
    ],
    skills: [
      { name: 'İK', items: ['İşe alım', 'Mülakat', 'Performans yönetimi', 'Oryantasyon', 'Özlük işlemleri'] },
      { name: 'Araçlar', items: ['SAP SuccessFactors', 'Kariyer.net', 'LinkedIn Recruiter', 'Excel'] },
      { name: 'Mevzuat', items: ['İş Kanunu', 'SGK', 'KVKK'] },
    ],
    sample: {
      firstName: 'Merve',
      lastName: 'Öztürk',
      city: 'Nilüfer, Bursa',
      jobs: [
        { position: 'İnsan Kaynakları Uzmanı', company: 'Marmara Otomotiv A.Ş.', start: '2021-08', end: '', current: true, bullets: [0, 1, 2, 3] },
        { position: 'İK Uzman Yardımcısı', company: 'Uludağ Tekstil', start: '2019-06', end: '2021-07', bullets: [5, 7] },
      ],
      school: 'Uludağ Üniversitesi',
      degree: 'bachelor',
      field: 'Çalışma Ekonomisi ve Endüstri İlişkileri',
      eduStart: '2015-09',
      eduEnd: '2019-06',
    },
  },
  {
    id: 'customer-service',
    name: 'Müşteri Hizmetleri',
    title: 'Müşteri Deneyimi Uzmanı',
    summary:
      'Çağrı merkezi ve canlı destek kanallarında [4] yıllık deneyime sahip Müşteri Deneyimi Uzmanı. Şikâyetleri hızlı ve kalıcı biçimde çözerek müşteri memnuniyetini artırırım.',
    bullets: [
      'Günde ortalama [80] çağrı ve canlı destek talebini karşıladım; ilk temasta çözüm oranım %[86].',
      'Müşteri memnuniyeti (CSAT) puanımı ekip ortalamasının [12] puan üzerinde tuttum.',
      'Sık sorulan sorular için bilgi bankası hazırlayarak tekrarlayan çağrıları %[20] azalttım.',
      'Şikâyet yönetim sürecini düzenleyerek ortalama çözüm süresini [72 saatten 24 saate] indirdim.',
      '[15] yeni temsilciye eğitim vererek ekibe uyum sürelerini kısalttım.',
      'Kayıp müşteri aramalarıyla [3 ayda] [120] aboneliği geri kazandım.',
      'Zendesk’te otomatik yönlendirme kuralları kurarak bekleme süresini %[35] düşürdüm.',
      'VIP müşteri hattını yöneterek kurumsal müşterilerde yenileme oranını %[94]’te tuttum.',
    ],
    skills: [
      { name: 'Müşteri hizmetleri', items: ['Çağrı merkezi', 'Canlı destek', 'Şikâyet yönetimi', 'İkna', 'Empati'] },
      { name: 'Araçlar', items: ['Zendesk', 'Salesforce Service Cloud', 'Freshdesk', 'Excel'] },
    ],
    sample: {
      firstName: 'Elif',
      lastName: 'Şahin',
      city: 'Ümraniye, İstanbul',
      jobs: [
        { position: 'Müşteri Deneyimi Uzmanı', company: 'Kolay İletişim Hizmetleri', start: '2022-01', end: '', current: true, bullets: [0, 1, 2, 3] },
        { position: 'Müşteri Temsilcisi', company: 'Yıldız Telekom', start: '2020-02', end: '2021-12', bullets: [5, 6] },
      ],
      school: 'Anadolu Üniversitesi',
      degree: 'associate',
      field: 'Halkla İlişkiler ve Tanıtım',
      eduStart: '2017-09',
      eduEnd: '2019-06',
    },
  },
  {
    id: 'project-manager',
    name: 'Proje Yönetimi',
    title: 'Proje Yöneticisi',
    summary:
      'Yazılım ve altyapı projelerinde [7] yıllık deneyime sahip Proje Yöneticisi (PMP). Çok paydaşlı projeleri zamanında, bütçe içinde ve ölçülebilir sonuçlarla teslim ederim.',
    bullets: [
      '[8] milyon TL bütçeli ERP dönüşüm projesini [14 ayda], bütçenin %[5] altında tamamladım.',
      '[25] kişilik dağıtık ekibi Scrum ile yöneterek teslim öngörülebilirliğini %[40] artırdım.',
      'Risk kaydı ve haftalık paydaş raporlaması kurarak gecikmeleri erken aşamada [3 sprint] önce yakaladım.',
      '[4] tedarikçiyle sözleşme ve SLA yönetimini yürüterek dış kaynak maliyetini %[12] azalttım.',
      'Proje yönetim ofisinin (PMO) şablonlarını hazırlayarak [11] projede ortak raporlama standardı oluşturdum.',
      'Canlıya geçişi [2.000] kullanıcıyla kesintisiz gerçekleştirdim.',
      'Jira ve Confluence’ı kurumsal standart hâline getirerek proje görünürlüğünü artırdım.',
      'Yönetim kuruluna aylık portföy sunumu yaparak yatırım kararlarına veri sağladım.',
    ],
    skills: [
      { name: 'Yönetim', items: ['Proje yönetimi', 'Scrum', 'Kanban', 'Risk yönetimi', 'Paydaş yönetimi', 'Bütçe'] },
      { name: 'Araçlar', items: ['Jira', 'Confluence', 'MS Project', 'Power BI'] },
    ],
    sample: {
      firstName: 'Can',
      lastName: 'Aydın',
      city: 'Şişli, İstanbul',
      jobs: [
        { position: 'Proje Yöneticisi', company: 'Boğaziçi Bilişim A.Ş.', start: '2020-04', end: '', current: true, bullets: [0, 1, 2, 5] },
        { position: 'İş Analisti', company: 'Atlas Danışmanlık', start: '2017-07', end: '2020-03', bullets: [4, 6] },
      ],
      school: 'İstanbul Teknik Üniversitesi',
      degree: 'bachelor',
      field: 'Endüstri Mühendisliği',
      eduStart: '2012-09',
      eduEnd: '2017-06',
      certificates: [{ name: 'Project Management Professional (PMP)', issuer: 'PMI', date: '2021-05' }],
    },
  },
  {
    id: 'graphic-design',
    name: 'Grafik Tasarım',
    title: 'Grafik Tasarımcı',
    summary:
      'Marka kimliği, dijital ve basılı tasarımda [5] yıllık deneyime sahip Grafik Tasarımcı. Markaların hikâyesini tutarlı ve ölçülebilir etki yaratan görsellerle anlatırım.',
    bullets: [
      '[30]’dan fazla marka için logo ve kurumsal kimlik tasarladım.',
      'Sosyal medya şablon sistemi kurarak içerik üretim süresini %[50] kısalttım.',
      'Yeniden tasarladığım ambalaj, raf testlerinde fark edilirliği %[35] artırdı.',
      'E-ticaret sitesi için banner setleri tasarlayarak kampanya tıklama oranını %[18] yükselttim.',
      'Matbaa süreçlerini yöneterek baskı hatalarını sıfıra indirdim ve maliyeti %[15] düşürdüm.',
      'Figma’da bileşen kütüphanesi kurarak yazılım ekibiyle tasarım teslim süresini yarıya indirdim.',
      'Fuar standı ve tanıtım materyallerini [3 haftada] teslim ettim.',
      '[2] stajyer tasarımcıya mentorluk yaptım.',
    ],
    skills: [
      { name: 'Tasarım', items: ['Kurumsal kimlik', 'Ambalaj', 'Sosyal medya', 'Baskı öncesi', 'Tipografi'] },
      { name: 'Araçlar', items: ['Illustrator', 'Photoshop', 'InDesign', 'Figma', 'After Effects'] },
    ],
    sample: {
      firstName: 'Ayşe',
      lastName: 'Koç',
      city: 'Karşıyaka, İzmir',
      jobs: [
        { position: 'Grafik Tasarımcı', company: 'Liman Reklam Ajansı', start: '2021-09', end: '', current: true, bullets: [0, 1, 2, 5] },
        { position: 'Junior Grafik Tasarımcı', company: 'Renk Matbaacılık', start: '2019-10', end: '2021-08', bullets: [4, 6] },
      ],
      school: 'Mimar Sinan Güzel Sanatlar Üniversitesi',
      degree: 'bachelor',
      field: 'Grafik Tasarım',
      eduStart: '2015-09',
      eduEnd: '2019-06',
    },
  },
  {
    id: 'logistics',
    name: 'Lojistik ve Satın Alma',
    title: 'Lojistik Uzmanı',
    summary:
      'Depo, sevkiyat ve tedarik zinciri yönetiminde [6] yıllık deneyime sahip Lojistik Uzmanı. Stok doğruluğunu ve teslimat performansını artıran süreçler kurarım.',
    bullets: [
      'Günlük [600] siparişlik depo operasyonunu yöneterek zamanında sevkiyat oranını %[98]’e çıkardım.',
      'Barkodlu stok sayım sistemine geçerek stok doğruluğunu %[91]’den %[99,5]’e yükselttim.',
      'Taşıyıcı firmalarla navlun pazarlığı yaparak yıllık taşıma maliyetini %[14] düşürdüm.',
      'Rota planlamasını optimize ederek araç başına günlük teslimat sayısını [18]’den [24]’e çıkardım.',
      'İthalat süreçlerinde gümrük müşavirliğiyle koordinasyonu yürüterek bekleme süresini [5 günden 2 güne] indirdim.',
      'SAP MM’de satın alma siparişlerini yöneterek [120] tedarikçiyle çalıştım.',
      'İş güvenliği uygulamalarıyla depoda [2 yıl] kazasız çalışma sağladım.',
      '[12] kişilik vardiya ekibini planlayıp yönettim.',
    ],
    skills: [
      { name: 'Lojistik', items: ['Depo yönetimi', 'Sevkiyat planlama', 'Stok yönetimi', 'İthalat', 'Gümrük'] },
      { name: 'Araçlar', items: ['SAP MM', 'WMS', 'İleri Excel', 'Power BI'] },
    ],
    sample: {
      firstName: 'Emre',
      lastName: 'Kurt',
      city: 'Gebze, Kocaeli',
      jobs: [
        { position: 'Lojistik Uzmanı', company: 'Körfez Dağıtım A.Ş.', start: '2021-03', end: '', current: true, bullets: [0, 1, 2, 3] },
        { position: 'Depo Sorumlusu', company: 'Hızlı Kargo', start: '2018-08', end: '2021-02', bullets: [6, 7] },
      ],
      school: 'Kocaeli Üniversitesi',
      degree: 'bachelor',
      field: 'Uluslararası Ticaret ve Lojistik',
      eduStart: '2014-09',
      eduEnd: '2018-06',
    },
  },
  {
    id: 'admin',
    name: 'İdari İşler / Asistan',
    title: 'Yönetici Asistanı',
    summary:
      'Üst yönetim desteği, ofis yönetimi ve organizasyon alanlarında [5] yıllık deneyime sahip Yönetici Asistanı. Yoğun takvimleri düzenli, gizliliğe özen göstererek yönetirim.',
    bullets: [
      'Genel Müdür ve [3] direktörün takvim, seyahat ve toplantı planlamasını yönettim.',
      'Yıllık [150] kişilik bayi toplantısının organizasyonunu bütçe içinde gerçekleştirdim.',
      'Ofis tedarikçi sözleşmelerini yeniden müzakere ederek idari giderleri %[18] azalttım.',
      'Evrak arşivini dijitalleştirerek belge bulma süresini dakikalardan saniyelere indirdim.',
      'Yönetim kurulu toplantı tutanaklarını ve sunumlarını hazırladım.',
      'Yeni ofise taşınma sürecini [80] çalışan için kesintisiz koordine ettim.',
      'Ziyaretçi ve resepsiyon süreçleri için standart yazdım.',
      'İngilizce yazışmaları ve tercümeleri yürüttüm.',
    ],
    skills: [
      { name: 'İdari', items: ['Takvim yönetimi', 'Seyahat planlama', 'Organizasyon', 'Yazışma', 'Arşiv'] },
      { name: 'Araçlar', items: ['MS Office', 'Outlook', 'Teams', 'SAP Concur'] },
    ],
    sample: {
      firstName: 'Gizem',
      lastName: 'Yıldız',
      city: 'Maslak, İstanbul',
      jobs: [
        { position: 'Yönetici Asistanı', company: 'Doruk Enerji A.Ş.', start: '2021-02', end: '', current: true, bullets: [0, 1, 2, 4] },
        { position: 'İdari İşler Sorumlusu', company: 'Akdeniz Sigorta', start: '2019-01', end: '2021-01', bullets: [3, 5] },
      ],
      school: 'İstanbul Üniversitesi',
      degree: 'bachelor',
      field: 'İngiliz Dili ve Edebiyatı',
      eduStart: '2014-09',
      eduEnd: '2018-06',
    },
  },
  {
    id: 'engineer',
    name: 'Mühendislik (Üretim)',
    title: 'Üretim Mühendisi',
    summary:
      'Otomotiv yan sanayiinde [5] yıllık deneyime sahip Üretim Mühendisi. Yalın üretim ve kalite araçlarıyla verimliliği artıran, fireyi azaltan projeler yürütürüm.',
    bullets: [
      'Yalın üretim projesiyle hat verimliliğini (OEE) %[64]’ten %[79]’a çıkardım.',
      'Kalıp değişim süresini SMED ile [90 dakikadan 25 dakikaya] indirdim.',
      'Hurda oranını kök neden analizi (8D) ile %[3,2]’den %[1,1]’e düşürdüm.',
      'Yeni ürünün seri üretime geçişini (PPAP) müşteri takvimine uygun tamamladım.',
      '[40] operatöre iş talimatı ve 5S eğitimi verdim.',
      'Enerji izleme projesiyle hat başına elektrik tüketimini %[11] azalttım.',
      'ISO 9001 ve IATF 16949 denetimlerine süreç sahibi olarak katıldım; majör bulgu çıkmadı.',
      'AutoCAD ile yerleşim planı hazırlayarak hat içi taşımayı %[30] azalttım.',
    ],
    skills: [
      { name: 'Üretim', items: ['Yalın üretim', 'SMED', '5S', 'Kaizen', '8D', 'PPAP', 'FMEA'] },
      { name: 'Araçlar', items: ['AutoCAD', 'SolidWorks', 'Minitab', 'SAP PP', 'Excel'] },
      { name: 'Standartlar', items: ['ISO 9001', 'IATF 16949'] },
    ],
    sample: {
      firstName: 'Mert',
      lastName: 'Polat',
      city: 'Osmangazi, Bursa',
      jobs: [
        { position: 'Üretim Mühendisi', company: 'Bursa Metal Parça A.Ş.', start: '2021-06', end: '', current: true, bullets: [0, 1, 2, 6] },
        { position: 'Proses Mühendisi', company: 'Teknik Kalıp San.', start: '2019-07', end: '2021-05', bullets: [3, 7] },
      ],
      school: 'Bursa Uludağ Üniversitesi',
      degree: 'bachelor',
      field: 'Makine Mühendisliği',
      eduStart: '2014-09',
      eduEnd: '2019-06',
    },
  },
];

export const PROFESSION_MAP = Object.fromEntries(PROFESSIONS.map((p) => [p.id, p]));
