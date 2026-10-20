import fs from 'fs';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { TypstEngine } from '../src/render/engine';
import { buildModel } from '../src/render/buildModel';
import { toPlainText } from '../src/render/plainText';
import { sampleCV } from '../src/model/sample';
import { PROFESSIONS } from '../src/content/professions';
import { sampleFor } from '../src/content/gallery';
import { extractPdfText } from '../src/ats/pdfText';
import { applyTemplate, TEMPLATES } from '../src/model/templates';
import { buildDocx } from '../src/export/docx';
import { parseResume, pdfLines, docxLines, textLines, takeRange, headingKey } from '../src/import/generic';
import type { CV } from '../src/model/types';

let fail = 0;
const check = (name: string, ok: boolean, info: unknown = '') => {
  if (!ok) {
    fail++;
    console.log('  FAIL', name, info);
  }
};
// birim
const R = (t: string) => takeRange(t).range;
check('range tr short', JSON.stringify(R('Eyl 2020 – Devam ediyor')) === JSON.stringify({ start: '2020-09', end: '', current: true }), R('Eyl 2020 – Devam ediyor'));
check('range numeric', JSON.stringify(R('09/2019 - 03/2022')) === JSON.stringify({ start: '2019-09', end: '2022-03', current: false }), R('09/2019 - 03/2022'));
check('range years', JSON.stringify(R('2015 – 2019')) === JSON.stringify({ start: '2015', end: '2019', current: false }));
check('range en', JSON.stringify(R('Jan 2021 - Present')) === JSON.stringify({ start: '2021-01', end: '', current: true }), R('Jan 2021 - Present'));
check('range long tr', JSON.stringify(R('Ocak 2020 - Halen')) === JSON.stringify({ start: '2020-01', end: '', current: true }), R('Ocak 2020 - Halen'));
check('range dotted', R('2018.06 – 2020.01')?.start === '2018-06', R('2018.06 – 2020.01'));
check('heading spaced', headingKey('D E N E Y İ M') === 'experience');
check('heading colon', headingKey('Eğitim Bilgileri:') === 'education');
check('heading en', headingKey('WORK EXPERIENCE') === 'experience');
check('not heading', headingKey('Bilgi İşlem Uzmanı') === null);

const nm = 'node_modules/@myriaddreamin/';
const eng = new TypstEngine({
  compilerWasm: () => fs.readFileSync(nm + 'typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm'),
  rendererWasm: () => fs.readFileSync(nm + 'typst-ts-renderer/pkg/typst_ts_renderer_bg.wasm'),
  loadFile: async (p) => new Uint8Array(fs.readFileSync('public/' + p)),
});

/** asıl CV ile içe aktarılanı karşılaştırır, 0-1 skor döner */
function score(orig: CV, got: CV, label: string, verbose = false) {
  const pts: [string, boolean][] = [];
  const P = orig.personal, G = got.personal;
  pts.push(['ad', `${G.firstName} ${G.lastName}`.trim() === `${P.firstName} ${P.lastName}`.trim()]);
  pts.push(['unvan', G.title === P.title]);
  pts.push(['e-posta', G.email === P.email]);
  pts.push(['telefon', G.phone.replace(/\D/g, '').endsWith(P.phone.replace(/\D/g, '').slice(-10))]);
  pts.push(['linkedin', got.links.some((l) => l.type === 'linkedin') === orig.links.some((l) => l.type === 'linkedin')]);
  pts.push(['özet', !!got.summary && got.summary.slice(0, 40) === orig.summary.slice(0, 40)]);
  const oe = orig.sections.experience, ge = got.sections.experience;
  pts.push(['deneyim sayısı', ge.length === oe.length]);
  oe.forEach((e, i) => {
    const g = ge[i];
    pts.push([`poz${i}`, !!g && g.position === e.position]);
    pts.push([`şirket${i}`, !!g && g.company === e.company]);
    pts.push([`tarih${i}`, !!g && JSON.stringify(g.dates) === JSON.stringify(e.dates)]);
    pts.push([`madde${i}`, !!g && (g.bullets as string[]).length === (e.bullets as string[]).length]);
  });
  const oed = orig.sections.education, ged = got.sections.education;
  pts.push(['eğitim', ged.length === oed.length && ged[0]?.school === oed[0]?.school]);
  const os = orig.sections.skills.flatMap((s) => s.items as string[]);
  const gs = got.sections.skills.flatMap((s) => s.items as string[]);
  pts.push(['yetenekler', os.filter((s) => gs.includes(s)).length >= os.length * 0.9]);
  pts.push(['diller', got.sections.languages.length === orig.sections.languages.length]);
  const ok = pts.filter((p) => p[1]).length / pts.length;
  const miss = pts.filter((p) => !p[1]).map((p) => p[0]);
  console.log(`${(ok * 100).toFixed(0).padStart(3)}%  ${label}${miss.length ? '  eksik: ' + miss.join(', ') : ''}`);
  if (verbose && miss.length) console.log(JSON.stringify({ exp: ge.map((e) => [e.position, e.company, e.dates, (e.bullets as string[]).length]), edu: ged.map((e) => [e.school, e.degree, e.field]) }, null, 0));
  return ok;
}

const results: number[] = [];
const cvs = [sampleCV(), ...PROFESSIONS.map((p) => sampleFor(p.id))];
console.log('--- PDF (şablon × tarih konumu)');
for (const t of TEMPLATES) {
  for (const pos of ['right', 'below', 'inline'] as const) {
    const cv = applyTemplate(sampleCV(), t.id);
    cv.design.datePosition = pos;
    const r = await eng.pdf(buildModel(cv), null);
    const pdf = await extractPdfText(r.pdf!, pdfjs as any);
    results.push(score(cv, parseResume(pdfLines(pdf)).cv, `pdf ${t.id}/${pos}`, process.env.V === '1'));
  }
}
console.log('--- PDF (meslek örnekleri)');
for (const cv of cvs.slice(1)) {
  const r = await eng.pdf(buildModel(cv), null);
  const pdf = await extractPdfText(r.pdf!, pdfjs as any);
  results.push(score(cv, parseResume(pdfLines(pdf)).cv, `pdf ${cv.name}`, process.env.V === '1'));
}
console.log('--- DOCX');
for (const cv of cvs.slice(0, 5)) {
  const blob = await buildDocx(buildModel(cv));
  const data = new Uint8Array(await blob.arrayBuffer());
  results.push(score(cv, parseResume(await docxLines(data)).cv, `docx ${cv.name}`, process.env.V === '1'));
}
console.log('--- TXT');
for (const cv of cvs.slice(0, 5)) results.push(score(cv, parseResume(textLines(toPlainText(buildModel(cv)))).cv, `txt ${cv.name}`, process.env.V === '1'));

// farklı biçimde elle yazılmış CV'ler
console.log('--- elle yazılmış');
const hand1 = `AHMET KAYA
Yazılım Geliştirici
ahmet.kaya@gmail.com | 0532 111 22 33 | Kadıköy, İstanbul
github.com/ahmetkaya

ÖZET
5 yıllık backend deneyimine sahip yazılım geliştiriciyim. Java ve Spring Boot ile ölçeklenebilir servisler geliştiriyorum.

İŞ DENEYİMİ
Kıdemli Yazılım Geliştirici | Trendyol | 03/2021 - Halen
- Sipariş servisini mikroservislere taşıdım; yanıt süresini %40 düşürdüm.
- 4 kişilik ekibe mentorluk yaptım.
Yazılım Geliştirici | Logo Yazılım | 06/2018 - 02/2021
- ERP entegrasyonları geliştirdim.

EĞİTİM
İstanbul Teknik Üniversitesi
Bilgisayar Mühendisliği, Lisans
2014 - 2018

YETENEKLER
Diller: Java, Kotlin, SQL
Araçlar: Docker, Kubernetes, Git

YABANCI DİLLER
İngilizce - İleri (C1)
Almanca - Başlangıç

KİŞİSEL BİLGİLER
Doğum Tarihi: 12.04.1996
Askerlik Durumu: Yapıldı
Ehliyet: B
`;
const h1 = parseResume(textLines(hand1)).cv;
const e1 = h1.sections.experience;
check('hand1 ad', h1.personal.firstName === 'Ahmet' && h1.personal.lastName === 'Kaya', [h1.personal.firstName, h1.personal.lastName]);
check('hand1 unvan', h1.personal.title === 'Yazılım Geliştirici', h1.personal.title);
check('hand1 tel', h1.personal.phone.replace(/\D/g, '').endsWith('5321112233'), h1.personal.phone);
check('hand1 konum', /Kadıköy, İstanbul/i.test(h1.personal.location), h1.personal.location);
check('hand1 2 deneyim', e1.length === 2, e1.map((e) => [e.position, e.company]));
check('hand1 poz/şirket', e1[0]?.position === 'Kıdemli Yazılım Geliştirici' && e1[0]?.company === 'Trendyol', e1[0]);
check('hand1 tarih', (e1[0]?.dates as any)?.current === true && (e1[1]?.dates as any)?.end === '2021-02', e1.map((e) => e.dates));
check('hand1 madde', (e1[0]?.bullets as string[])?.length === 2);
check('hand1 eğitim', h1.sections.education[0]?.school === 'İstanbul Teknik Üniversitesi' && h1.sections.education[0]?.degree === 'bachelor' && h1.sections.education[0]?.field === 'Bilgisayar Mühendisliği', h1.sections.education[0]);
check('hand1 yetenek grupları', h1.sections.skills.length === 2 && (h1.sections.skills[1].items as string[]).includes('Kubernetes'), h1.sections.skills);
check('hand1 diller', h1.sections.languages.length === 2 && h1.sections.languages[0].level === 'C1', h1.sections.languages);
check('hand1 kişisel', h1.personal.birthDate === '1996-04-12' && h1.personal.military === 'done' && h1.personal.licenses.join() === 'B', [h1.personal.birthDate, h1.personal.military, h1.personal.licenses]);

const hand2 = `Jane Doe
Data Analyst
jane.doe@example.com · +44 7700 900123 · London
linkedin.com/in/janedoe

Professional Summary
Data analyst with 4 years of experience turning messy data into decisions.

Experience
Data Analyst
Acme Corp, London
Jan 2022 – Present
• Built 12 Power BI dashboards used by 300 staff.
• Cut reporting time by 50% with automated SQL pipelines.
Junior Analyst
Globex Ltd
Jun 2020 – Dec 2021
• Cleaned and analysed sales data.

Education
University of Manchester
BSc Mathematics
2016 – 2019

Skills
SQL, Python, Power BI, Excel, Tableau

Languages
English (Native), Spanish (Intermediate)
`;
const h2 = parseResume(textLines(hand2)).cv;
check('hand2 en', h2.lang === 'en');
check('hand2 ad', h2.personal.firstName === 'Jane' && h2.personal.lastName === 'Doe');
check('hand2 2 deneyim', h2.sections.experience.length === 2, h2.sections.experience.map((e) => [e.position, e.company, e.dates]));
check('hand2 şirket', h2.sections.experience[0]?.company === 'Acme Corp' && h2.sections.experience[1]?.company === 'Globex Ltd', h2.sections.experience.map((e) => e.company));
check('hand2 eğitim', h2.sections.education[0]?.school === 'University of Manchester' && h2.sections.education[0]?.degree === 'bachelor', h2.sections.education[0]);
check('hand2 yetenek', (h2.sections.skills[0]?.items as string[])?.length === 5, h2.sections.skills);
check('hand2 dil', h2.sections.languages.length === 2 && h2.sections.languages[0].level === 'native' && h2.sections.languages[1].level === 'B1', h2.sections.languages);

// iki sütunlu (kenar çubuklu) PDF
{
  const pdf = await extractPdfText(new Uint8Array(fs.readFileSync('scripts/fixtures/sidebar.pdf')), pdfjs as any);
  const c = parseResume(pdfLines(pdf)).cv;
  check('sidebar ad/unvan', c.personal.firstName === 'Selin' && c.personal.title === 'UI/UX Tasarımcı', c.personal);
  check('sidebar iletişim', c.personal.email === 'selin.demir@mail.com' && c.personal.location === 'Çankaya, Ankara' && c.links.length === 1, [c.personal.email, c.personal.location, c.links]);
  check('sidebar deneyim', c.sections.experience.length === 2 && c.sections.experience[1].company === 'Bulut Yazılım A.Ş.' && (c.sections.experience[0].bullets as string[]).length === 2, c.sections.experience.map((e) => [e.position, e.company]));
  check('sidebar eğitim', c.sections.education[0]?.school === 'Hacettepe Üniversitesi' && c.sections.education[0]?.field === 'Grafik Tasarım', c.sections.education[0]);
  check('sidebar yetenek/dil', (c.sections.skills[0]?.items as string[])?.length === 6 && c.sections.languages.length === 2, [c.sections.skills, c.sections.languages]);
}

const avg = results.reduce((a, b) => a + b, 0) / results.length;
console.log(`\nortalama doğruluk: %${(avg * 100).toFixed(1)}  (en düşük %${(Math.min(...results) * 100).toFixed(0)})`);
check('ortalama ≥ %90', avg >= 0.9, avg);
console.log(fail ? `${fail} BAŞARISIZ` : 'içe aktarma testleri geçti');
process.exit(fail ? 1 : 0);
