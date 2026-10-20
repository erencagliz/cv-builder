/**
 * Meslek → sık aranan anahtar kelimeler.
 * İlan yapıştırılmadığında bile CV'nin unvanına bakıp o rolde işverenlerin ve ATS filtrelerinin en sık aradığı
 * terimleri önerir. Liste, Türkiye'deki iş ilanlarında sık geçen sert yetkinliklerden derlenmiştir; yumuşak beceriler bilerek yoktur.
 */
export interface Role {
  id: string;
  name: string;
  /** unvanda geçerse bu rol seçilir (küçük harf, ı→i katlanmış) */
  match: string[];
  keywords: string[];
}

export const ROLES: Role[] = [
  {
    id: 'it-support',
    name: 'Bilgi işlem / IT destek',
    match: ['bilgi islem', 'it destek', 'it uzman', 'it specialist', 'it support', 'it technician', 'it engineer', 'it support', 'help desk', 'helpdesk', 'teknik destek', 'sistem destek', 'it specialist', 'desktop support', 'son kullanici'],
    keywords: ['Active Directory', 'Group Policy', 'Windows Server', 'Microsoft 365', 'DNS', 'DHCP', 'TCP/IP', 'VPN', 'Firewall', 'PowerShell', 'Help Desk', 'ITIL', 'Yedekleme', 'Sanallaştırma', 'Intune', 'Envanter'],
  },
  {
    id: 'sysadmin',
    name: 'Sistem / ağ yöneticisi',
    match: ['sistem yonetici', 'sistem uzman', 'system admin', 'sysadmin', 'network', 'ag yonetici', 'ag uzman', 'altyapi', 'infrastructure', 'network engineer', 'sistem muhendis'],
    keywords: ['Windows Server', 'Linux', 'Active Directory', 'VMware', 'Hyper-V', 'Cisco', 'Fortigate', 'VLAN', 'Routing', 'Switching', 'Veeam', 'Zabbix', 'Azure', 'Ansible', 'Bash', 'PowerShell'],
  },
  {
    id: 'security',
    name: 'Siber güvenlik',
    match: ['guvenlik uzman', 'siber', 'security', 'soc analist', 'pentest', 'penetrasyon', 'bilgi guvenligi'],
    keywords: ['SIEM', 'SOC', 'Penetrasyon testi', 'ISO 27001', 'Firewall', 'IDS/IPS', 'EDR', 'Splunk', 'Zafiyet analizi', 'OWASP', 'Olay müdahalesi', 'Kali Linux', 'Wireshark', 'KVKK'],
  },
  {
    id: 'frontend',
    name: 'Frontend geliştirici',
    match: ['frontend', 'front-end', 'front end', 'ui developer', 'web gelistirici', 'react developer'],
    keywords: ['JavaScript', 'TypeScript', 'React', 'Next.js', 'HTML', 'CSS', 'Redux', 'REST API', 'Git', 'Jest', 'Webpack', 'Vite', 'Responsive tasarım', 'Erişilebilirlik', 'Tailwind', 'Figma'],
  },
  {
    id: 'backend',
    name: 'Backend geliştirici',
    match: ['backend', 'back-end', 'back end', 'java developer', '.net developer', 'net gelistirici', 'python developer', 'node.js', 'api gelistirici'],
    keywords: ['REST API', 'SQL', 'PostgreSQL', 'Docker', 'Kubernetes', 'Mikroservis', 'Redis', 'Kafka', 'Git', 'CI/CD', 'Unit test', 'AWS', 'Java', 'Spring Boot', 'C#', '.NET', 'Node.js', 'Python'],
  },
  {
    id: 'fullstack',
    name: 'Yazılım geliştirici',
    match: ['full stack', 'fullstack', 'full-stack', 'yazilim gelistirici', 'yazilim muhendis', 'software engineer', 'software developer', 'yazilim uzman', 'developer', 'programci'],
    keywords: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'REST API', 'SQL', 'Git', 'Docker', 'CI/CD', 'Unit test', 'Agile', 'Scrum', 'Mikroservis', 'AWS', 'Clean Code'],
  },
  {
    id: 'mobile',
    name: 'Mobil geliştirici',
    match: ['mobil', 'mobile', 'android', 'ios developer', 'flutter', 'react native'],
    keywords: ['Kotlin', 'Swift', 'Flutter', 'React Native', 'Android', 'iOS', 'REST API', 'Firebase', 'Git', 'App Store', 'Google Play', 'Unit test', 'MVVM'],
  },
  {
    id: 'devops',
    name: 'DevOps / bulut',
    match: ['devops', 'sre', 'site reliability', 'cloud engineer', 'bulut', 'platform engineer'],
    keywords: ['Docker', 'Kubernetes', 'Terraform', 'Ansible', 'CI/CD', 'Jenkins', 'GitHub Actions', 'AWS', 'Azure', 'Linux', 'Prometheus', 'Grafana', 'Helm', 'Bash', 'Python'],
  },
  {
    id: 'data',
    name: 'Veri analisti / bilimci',
    match: ['veri analist', 'data analyst', 'data scientist', 'veri bilim', 'is zekasi', 'business intelligence', 'bi uzman', 'raporlama uzman', 'analytics'],
    keywords: ['SQL', 'Python', 'Power BI', 'Tableau', 'Excel', 'Pandas', 'İstatistik', 'Veri görselleştirme', 'ETL', 'Makine öğrenmesi', 'A/B test', 'Dashboard', 'BigQuery', 'KPI'],
  },
  {
    id: 'design',
    name: 'UI/UX tasarımcı',
    match: ['ui/ux', 'ux', 'ui designer', 'urun tasarim', 'product designer', 'arayuz', 'kullanici deneyimi'],
    keywords: ['Figma', 'Prototipleme', 'Kullanıcı araştırması', 'Wireframe', 'Design System', 'Kullanılabilirlik testi', 'Adobe XD', 'User Flow', 'Erişilebilirlik', 'Responsive tasarım'],
  },
  {
    id: 'graphic',
    name: 'Grafik tasarımcı',
    match: ['grafik', 'graphic', 'gorsel tasarim', 'art director', 'sanat yonetmen'],
    keywords: ['Photoshop', 'Illustrator', 'InDesign', 'After Effects', 'Kurumsal kimlik', 'Tipografi', 'Baskı öncesi', 'Sosyal medya tasarımı', 'Figma', 'Premiere'],
  },
  {
    id: 'accounting',
    name: 'Muhasebe',
    match: ['muhasebe', 'accountant', 'accounting', 'mali musavir', 'on muhasebe'],
    keywords: ['Genel muhasebe', 'Ön muhasebe', 'KDV', 'Beyanname', 'E-fatura', 'E-defter', 'Mutabakat', 'Bordro', 'Logo', 'Netsis', 'SAP', 'Excel', 'Mizan', 'Bilanço', 'Vergi mevzuatı'],
  },
  {
    id: 'finance',
    name: 'Finans',
    match: ['finans', 'finance', 'financial', 'butce', 'mali analist', 'controller', 'hazine', 'treasury', 'yatirim'],
    keywords: ['Finansal analiz', 'Bütçe', 'Raporlama', 'Nakit akışı', 'Excel', 'Power BI', 'SAP', 'IFRS', 'Maliyet analizi', 'Finansal modelleme', 'Konsolidasyon', 'Varyans analizi'],
  },
  {
    id: 'hr',
    name: 'İnsan kaynakları',
    match: ['insan kaynak', 'human resources', 'ik uzman', 'hr ', 'hr specialist', 'recruit', 'ise alim', 'isealim', 'yetenek kazanim', 'talent'],
    keywords: ['İşe alım', 'Mülakat', 'Bordro', 'Performans yönetimi', 'Oryantasyon', 'İş hukuku', 'SGK', 'Eğitim planlama', 'Yetkinlik', 'Ücret yönetimi', 'HRIS', 'Çalışan bağlılığı', 'Excel'],
  },
  {
    id: 'sales',
    name: 'Satış',
    match: ['satis', 'sales', 'account manager', 'bolge mudur', 'business development', 'is gelistirme'],
    keywords: ['Satış hedefi', 'B2B', 'CRM', 'Salesforce', 'Müşteri portföyü', 'Müzakere', 'Teklif hazırlama', 'Pazar analizi', 'Saha satış', 'Kurumsal satış', 'Ciro', 'KPI'],
  },
  {
    id: 'marketing',
    name: 'Pazarlama',
    match: ['pazarlama', 'marketing', 'dijital', 'seo', 'sosyal medya', 'social media', 'brand', 'marka', 'growth', 'performans pazarlama', 'content'],
    keywords: ['Dijital pazarlama', 'SEO', 'SEM', 'Google Ads', 'Meta Ads', 'Google Analytics', 'İçerik pazarlaması', 'Sosyal medya', 'E-posta pazarlama', 'CRM', 'A/B test', 'ROAS', 'Marka yönetimi', 'Kampanya yönetimi'],
  },
  {
    id: 'customer',
    name: 'Müşteri hizmetleri',
    match: ['musteri temsilci', 'musteri hizmet', 'customer service', 'customer support', 'cagri merkezi', 'call center', 'musteri iliskileri', 'customer success'],
    keywords: ['Müşteri memnuniyeti', 'CRM', 'Çağrı merkezi', 'Şikâyet yönetimi', 'SLA', 'Zendesk', 'Canlı destek', 'NPS', 'İkna', 'Problem çözme'],
  },
  {
    id: 'project',
    name: 'Proje / ürün yöneticisi',
    match: ['proje yonetici', 'project manager', 'proje muduru', 'product manager', 'urun yonetici', 'product owner', 'scrum master', 'pmo'],
    keywords: ['Proje yönetimi', 'Agile', 'Scrum', 'Jira', 'Paydaş yönetimi', 'Risk yönetimi', 'Bütçe', 'Yol haritası', 'Önceliklendirme', 'KPI', 'PMP', 'Confluence', 'Gereksinim analizi'],
  },
  {
    id: 'logistics',
    name: 'Lojistik / tedarik zinciri',
    match: ['lojistik', 'logistics', 'tedarik', 'supply chain', 'depo', 'warehouse', 'satin alma', 'satinalma', 'purchasing', 'procurement', 'dis ticaret', 'ithalat', 'ihracat'],
    keywords: ['Tedarik zinciri', 'Satın alma', 'Stok yönetimi', 'Depo yönetimi', 'SAP', 'ERP', 'Gümrük', 'İthalat', 'İhracat', 'Incoterms', 'Tedarikçi yönetimi', 'Maliyet düşürme', 'Excel'],
  },
  {
    id: 'mechanical',
    name: 'Makine / üretim mühendisi',
    match: ['makine muhendis', 'mechanical', 'uretim muhendis', 'imalat', 'endustri muhendis', 'industrial engineer', 'proses muhendis', 'kalite muhendis', 'quality'],
    keywords: ['AutoCAD', 'SolidWorks', 'Teknik resim', 'Yalın üretim', '5S', 'Kaizen', 'Six Sigma', 'ISO 9001', 'Kalite kontrol', 'Üretim planlama', 'FMEA', 'Kök neden analizi', 'OEE'],
  },
  {
    id: 'electrical',
    name: 'Elektrik / elektronik mühendisi',
    match: ['elektrik', 'elektronik', 'electrical', 'electronics', 'otomasyon', 'automation', 'plc'],
    keywords: ['PLC', 'SCADA', 'AutoCAD', 'Siemens', 'Elektrik projelendirme', 'Pano', 'Otomasyon', 'MATLAB', 'Arıza tespiti', 'Bakım', 'İSG'],
  },
  {
    id: 'civil',
    name: 'İnşaat / mimar',
    match: ['insaat', 'civil', 'mimar', 'architect', 'santiye', 'yapi denetim'],
    keywords: ['AutoCAD', 'Revit', 'SAP2000', 'Metraj', 'Hakediş', 'Şantiye yönetimi', 'Keşif', 'İş programı', 'Primavera', 'İSG', 'Statik hesap', 'SketchUp'],
  },
  {
    id: 'teacher',
    name: 'Öğretmen / eğitimci',
    match: ['ogretmen', 'teacher', 'egitmen', 'instructor', 'akademisyen', 'ogretim'],
    keywords: ['Ders planı', 'Müfredat', 'Ölçme ve değerlendirme', 'Sınıf yönetimi', 'Materyal geliştirme', 'Bireysel öğretim', 'Eğitim teknolojileri', 'Veli iletişimi', 'Pedagojik formasyon'],
  },
  {
    id: 'health',
    name: 'Sağlık',
    match: ['hemsire', 'nurse', 'doktor', 'hekim', 'eczaci', 'pharmacist', 'saglik', 'fizyoterapist', 'diyetisyen', 'tibbi'],
    keywords: ['Hasta bakımı', 'Enfeksiyon kontrolü', 'İlk yardım', 'Hasta kayıt', 'Tıbbi dokümantasyon', 'Hasta güvenliği', 'HBYS', 'Klinik protokol', 'İlaç uygulama'],
  },
  {
    id: 'admin',
    name: 'İdari işler / asistan',
    match: ['idari', 'asistan', 'assistant', 'sekreter', 'office manager', 'ofis yonetici', 'yonetici asistan', 'resepsiyon'],
    keywords: ['MS Office', 'Excel', 'Yazışma', 'Toplantı organizasyonu', 'Takvim yönetimi', 'Seyahat organizasyonu', 'Arşiv', 'Raporlama', 'Satın alma', 'Evrak takibi'],
  },
  {
    id: 'legal',
    name: 'Hukuk',
    match: ['avukat', 'lawyer', 'hukuk', 'legal', 'stajyer avukat'],
    keywords: ['Sözleşme', 'Dava takibi', 'İcra', 'İş hukuku', 'Ticaret hukuku', 'KVKK', 'Hukuki mütalaa', 'UYAP', 'Uyum', 'Dilekçe'],
  },
];

const fold = (t: string) => t.toLocaleLowerCase('tr-TR').replace(/ı/g, 'i').replace(/[şŞ]/g, 's').replace(/[ğĞ]/g, 'g').replace(/[üÜ]/g, 'u').replace(/[öÖ]/g, 'o').replace(/[çÇ]/g, 'c').replace(/[âÂ]/g, 'a');

/** Genel terimler: daha belirli bir eşleşme varsa (ör. "Frontend Developer") o kazanır */
const GENERIC = new Set(['developer', 'programci', 'software engineer', 'software developer', 'yazilim gelistirici', 'yazilim muhendis', 'yazilim uzman', 'dijital', 'quality', 'network']);

/** Unvana (ve olmazsa son pozisyona) bakarak en uygun rolü bulur. Belirli eşleşmeler (uzun olan) önce gelir. */
export function detectRole(...titles: string[]): Role | null {
  for (const raw of titles) {
    const t = ` ${fold(raw || '')} `;
    if (!t.trim()) continue;
    let best: { role: Role; len: number } | null = null;
    for (const r of ROLES)
      for (const m of r.match) {
        const len = GENERIC.has(m) ? 1 : m.length;
        if (t.includes(` ${m.trim()}`) && (!best || len > best.len)) best = { role: r, len };
      }
    if (best) return best.role;
  }
  return null;
}

export { fold };

/** İngilizce CV'ler için rol anahtar kelimelerinin İngilizce karşılıkları (teknoloji adları zaten ortaktır) */
export const KW_EN: Record<string, string> = {
  Yedekleme: 'Backup', Sanallaştırma: 'Virtualization', Envanter: 'Asset management', Routing: 'Routing', Switching: 'Switching',
  'Penetrasyon testi': 'Penetration testing', 'Zafiyet analizi': 'Vulnerability assessment', 'Olay müdahalesi': 'Incident response', KVKK: 'GDPR',
  'Responsive tasarım': 'Responsive design', Erişilebilirlik: 'Accessibility', Mikroservis: 'Microservices', İstatistik: 'Statistics',
  'Veri görselleştirme': 'Data visualization', 'Makine öğrenmesi': 'Machine learning', Prototipleme: 'Prototyping', 'Kullanıcı araştırması': 'User research',
  'Kullanılabilirlik testi': 'Usability testing', 'Kurumsal kimlik': 'Brand identity', Tipografi: 'Typography', 'Baskı öncesi': 'Prepress',
  'Sosyal medya tasarımı': 'Social media design', 'Genel muhasebe': 'General ledger', 'Ön muhasebe': 'Bookkeeping', KDV: 'VAT', Beyanname: 'Tax returns',
  'E-fatura': 'E-invoicing', 'E-defter': 'E-ledger', Mutabakat: 'Reconciliation', Bordro: 'Payroll', Mizan: 'Trial balance', Bilanço: 'Balance sheet',
  'Vergi mevzuatı': 'Tax regulations', 'Finansal analiz': 'Financial analysis', Bütçe: 'Budgeting', Raporlama: 'Reporting', 'Nakit akışı': 'Cash flow',
  'Maliyet analizi': 'Cost analysis', 'Finansal modelleme': 'Financial modelling', Konsolidasyon: 'Consolidation', 'Varyans analizi': 'Variance analysis',
  'İşe alım': 'Recruitment', Mülakat: 'Interviewing', 'Performans yönetimi': 'Performance management', Oryantasyon: 'Onboarding', 'İş hukuku': 'Employment law',
  SGK: 'Social security', 'Eğitim planlama': 'Training planning', Yetkinlik: 'Competency frameworks', 'Ücret yönetimi': 'Compensation', 'Çalışan bağlılığı': 'Employee engagement',
  'Satış hedefi': 'Sales targets', 'Müşteri portföyü': 'Account portfolio', Müzakere: 'Negotiation', 'Teklif hazırlama': 'Proposal writing', 'Pazar analizi': 'Market analysis',
  'Saha satış': 'Field sales', 'Kurumsal satış': 'Enterprise sales', Ciro: 'Revenue', 'Dijital pazarlama': 'Digital marketing', 'İçerik pazarlaması': 'Content marketing',
  'Sosyal medya': 'Social media', 'E-posta pazarlama': 'Email marketing', 'Marka yönetimi': 'Brand management', 'Kampanya yönetimi': 'Campaign management',
  'Müşteri memnuniyeti': 'Customer satisfaction', 'Çağrı merkezi': 'Call center', 'Şikâyet yönetimi': 'Complaint handling', 'Canlı destek': 'Live chat support',
  İkna: 'Persuasion', 'Problem çözme': 'Problem solving', 'Proje yönetimi': 'Project management', 'Paydaş yönetimi': 'Stakeholder management',
  'Risk yönetimi': 'Risk management', 'Yol haritası': 'Roadmapping', Önceliklendirme: 'Prioritization', 'Gereksinim analizi': 'Requirements analysis',
  'Tedarik zinciri': 'Supply chain', 'Satın alma': 'Procurement', 'Stok yönetimi': 'Inventory management', 'Depo yönetimi': 'Warehouse management',
  Gümrük: 'Customs', İthalat: 'Import', İhracat: 'Export', 'Tedarikçi yönetimi': 'Supplier management', 'Maliyet düşürme': 'Cost reduction',
  'Teknik resim': 'Technical drawing', 'Yalın üretim': 'Lean manufacturing', 'Kalite kontrol': 'Quality control', 'Üretim planlama': 'Production planning',
  'Kök neden analizi': 'Root cause analysis', 'Elektrik projelendirme': 'Electrical design', Pano: 'Switchboards', Otomasyon: 'Automation',
  'Arıza tespiti': 'Troubleshooting', Bakım: 'Maintenance', İSG: 'Health and safety', Metraj: 'Quantity take-off', Hakediş: 'Progress payments',
  'Şantiye yönetimi': 'Site management', Keşif: 'Cost estimation', 'İş programı': 'Scheduling', 'Statik hesap': 'Structural analysis',
  'Ders planı': 'Lesson planning', Müfredat: 'Curriculum', 'Ölçme ve değerlendirme': 'Assessment', 'Sınıf yönetimi': 'Classroom management',
  'Materyal geliştirme': 'Materials development', 'Bireysel öğretim': 'Differentiated instruction', 'Eğitim teknolojileri': 'EdTech',
  'Veli iletişimi': 'Parent communication', 'Pedagojik formasyon': 'Teaching certificate', 'Hasta bakımı': 'Patient care', 'Enfeksiyon kontrolü': 'Infection control',
  'İlk yardım': 'First aid', 'Hasta kayıt': 'Patient records', 'Tıbbi dokümantasyon': 'Medical documentation', 'Hasta güvenliği': 'Patient safety',
  HBYS: 'EHR', 'Klinik protokol': 'Clinical protocols', 'İlaç uygulama': 'Medication administration', Yazışma: 'Correspondence',
  'Toplantı organizasyonu': 'Meeting coordination', 'Takvim yönetimi': 'Calendar management', 'Seyahat organizasyonu': 'Travel arrangements', Arşiv: 'Filing',
  'Evrak takibi': 'Document control', Sözleşme: 'Contracts', 'Dava takibi': 'Litigation', İcra: 'Debt enforcement', 'Ticaret hukuku': 'Commercial law',
  'Hukuki mütalaa': 'Legal opinions', UYAP: 'Case management systems', Uyum: 'Compliance', Dilekçe: 'Legal drafting', 'Help Desk': 'Help Desk',
};
