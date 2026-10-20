import type { CV } from './types';
import { emptyCV, newEntry, uid } from './defaults';

/** Örnek CV: kurgusal bir kişi. */
export function sampleCV(): CV {
  const cv = emptyCV('Örnek CV – Bilgi İşlem');
  cv.personal = {
    ...cv.personal,
    firstName: 'Deniz',
    lastName: 'Yılmaz',
    title: 'Bilgi İşlem Uzmanı',
    email: 'deniz.yilmaz@ornek.com',
    phone: '+90 (532) 000 00 00',
    location: 'Ataşehir, İstanbul',
    birthDate: '1998-04-12',
    birthFormat: 'year',
    military: 'done',
    militaryDate: '2021-06',
    licenses: ['B'],
    licenseYear: '2017',
    travel: 'yes',
  };
  cv.links = [
    { id: uid(), type: 'linkedin', value: 'denizyilmaz', label: '' },
    { id: uid(), type: 'github', value: 'denizyilmaz', label: '' },
  ];
  cv.summary =
    'Kurumsal ortamlarda 6 yıllık deneyime sahip Bilgi İşlem Uzmanı. 250 kullanıcılı bir yapıda **Active Directory**, Group Policy ve son kullanıcı desteğini yönettim. Süreçleri otomatikleştirerek destek taleplerini azaltmaya ve sistemlerin kesintisiz çalışmasına odaklanıyorum.';
  cv.sections.experience = [
    newEntry({
      position: 'Bilgi İşlem Uzmanı',
      company: 'Anka Lojistik A.Ş.',
      location: 'İstanbul',
      employmentType: 'fulltime',
      workMode: 'hybrid',
      dates: { start: '2022-03', end: '', current: true },
      description: '',
      bullets: [
        '250 kullanıcılı Active Directory ve Group Policy yapısını yönettim; yeni personel hesap açılış süresini 1 günden 2 saate indirdim.',
        'PowerShell betikleriyle yazılım dağıtımını otomatikleştirerek aylık destek taleplerini %35 azalttım.',
        'Yazıcı, IP telefon ve çevre birimlerinin kurulum ve bakımını 3 lokasyonda yürüttüm.',
        'Yedekleme politikasını yeniden kurguladım; geri dönüş testleri ile veri kaybı riskini ortadan kaldırdım.',
      ],
      tags: ['Active Directory', 'Group Policy', 'PowerShell', 'Windows Server', 'Veeam'],
    }),
    newEntry({
      position: 'Bilgi İşlem Destek Uzmanı',
      company: 'Anka Lojistik A.Ş.',
      location: 'İstanbul',
      employmentType: 'fulltime',
      workMode: '',
      dates: { start: '2020-09', end: '2022-03', current: false },
      bullets: [
        'Günlük ortalama 30 son kullanıcı talebini SLA süreleri içinde çözdüm.',
        'Envanter takibini Excel’den GLPI sistemine taşıdım.',
      ],
      tags: [],
    }),
    newEntry({
      position: 'Stajyer – Sistem Destek',
      company: 'Mavi Yazılım',
      location: 'İstanbul',
      employmentType: 'intern',
      dates: { start: '2019-06', end: '2019-09', current: false },
      bullets: ['Bilgisayar kurulumları, rutin bakım ve ağ kablolama işlerinde görev aldım.'],
      tags: [],
    }),
  ];
  cv.sections.education = [
    newEntry({
      school: 'Marmara Üniversitesi',
      degree: 'associate',
      field: 'Bilgisayar Programcılığı',
      location: 'İstanbul',
      gpa: '3,21',
      gpaScale: '4',
      dates: { start: '2017-09', end: '2019-06', current: false },
      tags: [],
    }),
  ];
  cv.sections.skills = [
    newEntry({ name: 'Sistem', items: ['Active Directory', 'Group Policy', 'Windows Server', 'Microsoft 365', 'Intune'] }),
    newEntry({ name: 'Ağ', items: ['TCP/IP', 'DHCP', 'DNS', 'VLAN', 'Fortigate'] }),
    newEntry({ name: 'Araçlar', items: ['PowerShell', 'GLPI', 'Veeam', 'VMware vSphere'] }),
  ];
  cv.sections.languages = [
    newEntry({ language: 'Türkçe', level: 'native', exam: '', score: '' }),
    newEntry({ language: 'İngilizce', level: 'B2', exam: 'YDS', score: '72,5' }),
  ];
  cv.sections.certificates = [
    newEntry({ name: 'CCNA', issuer: 'Cisco', date: '2021-11', credentialId: '', url: '' }),
    newEntry({ name: 'Microsoft 365 Certified: Modern Desktop Administrator', issuer: 'Microsoft', date: '2023-02' }),
  ];
  cv.references.onRequest = true;
  return cv;
}
