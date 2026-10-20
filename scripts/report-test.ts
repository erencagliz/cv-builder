import fs from 'fs';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { TypstEngine } from '../src/render/engine';
import { buildModel } from '../src/render/buildModel';
import { toPlainText } from '../src/render/plainText';
import { sampleCV } from '../src/model/sample';
import { emptyCV, newEntry } from '../src/model/defaults';
import { PROFESSIONS } from '../src/content/professions';
import { sampleFor } from '../src/content/gallery';
import { extractPdfText } from '../src/ats/pdfText';
import { buildReport, scoreBullet, hasTerm } from '../src/ats/report';
import { detectRole, fold } from '../src/ats/roles';
import type { CV } from '../src/model/types';

let fail = 0;
const eq = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) {
    fail++;
    console.log('FAIL', name, 'got', got, 'want', want);
  }
};
const cond = (name: string, ok: boolean, info?: unknown) => {
  if (!ok) {
    fail++;
    console.log('FAIL', name, info ?? '');
  }
};

/* --- madde sınıflandırma --- */
const B = (t: string, l: 'tr' | 'en' = 'tr') => scoreBullet(t, l);
eq('tr strong', B('PowerShell betikleriyle yazılım dağıtımını otomatikleştirerek destek taleplerini %35 azalttım.').verb, 'strong');
eq('tr ettim', B('3 ekip arasında sürüm takvimini koordine ettim.').verb, 'strong');
eq('tr hayata', B('Yeni CRM sistemini 2 ayda hayata geçirdim.').verb, 'strong');
eq('tr weak', B('Sunucuların bakımından sorumluydum.').verb, 'weak');
eq('tr weak2', B('Projelerde görev aldım.').verb, 'weak');
eq('tr passive', B('Yedekleme sistemi kuruldu.').verb, 'passive');
eq('tr passive2', B('Tüm süreçler raporlandı.').verb, 'passive');
eq('tr passive edildi', B('Envanter sistemi entegre edildi.').verb, 'passive');
eq('tr nominal', B('Active Directory kullanıcı hesaplarının yönetilmesi').verb, 'nominal');
eq('tr active', B('Müşteri şikâyetlerini her gün inceledim.').verb, 'active');
eq('tr yürüttüm', B('3 lokasyonda bakım işlerini yürüttüm.').verb, 'strong');
eq('en strong', B('Reduced ticket volume by 35% by automating deployments.', 'en').verb, 'strong');
eq('en weak', B('Responsible for server maintenance.', 'en').verb, 'weak');
eq('en helped', B('Helped the team with releases.', 'en').verb, 'weak');
eq('en active', B('Refactored the billing module.', 'en').verb, 'active');
eq('metric pct', B('Hataları %40 azalttım.').metric, true);
eq('metric year only', B('2021 yılında yeni sisteme geçtim.').metric, false);
eq('metric word', B('Satışları iki katına çıkardım.').metric, true);
eq('result arak', B('Betik yazarak işi hızlandırdım.').result, true);
cond('great bullet ≥ 85', B('PowerShell betikleriyle yazılım dağıtımını otomatikleştirerek aylık destek taleplerini %35 azalttım.').score >= 85, B('PowerShell betikleriyle yazılım dağıtımını otomatikleştirerek aylık destek taleplerini %35 azalttım.'));
cond('bad bullet ≤ 35', B('Çeşitli işlerden sorumluydum.').score <= 35, B('Çeşitli işlerden sorumluydum.'));
/* --- terim ve rol --- */
eq('term suffix', hasTerm(fold('Bütçesini ve stok yönetimini üstlendim'), 'Stok yönetimi'), true);
eq('term no partial', hasTerm(fold('PostgreSQL kullandım'), 'SQL'), false);
eq('term space variant', hasTerm(fold('helpdesk ekibini yönettim'), 'Help Desk'), true);
eq('role it', detectRole('Bilgi İşlem Uzmanı')?.id, 'it-support');
eq('role frontend', detectRole('Senior Frontend Developer')?.id, 'frontend');
eq('role muhasebe', detectRole('Muhasebe Uzmanı')?.id, 'accounting');
eq('role none', detectRole('Astronot'), null);

/* --- gerçek PDF ile uçtan uca --- */
const nm = 'node_modules/@myriaddreamin/';
const eng = new TypstEngine({
  compilerWasm: () => fs.readFileSync(nm + 'typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm'),
  rendererWasm: () => fs.readFileSync(nm + 'typst-ts-renderer/pkg/typst_ts_renderer_bg.wasm'),
  loadFile: async (p) => new Uint8Array(fs.readFileSync('public/' + p)),
});
async function report(cv: CV) {
  const model = buildModel(cv);
  const r = await eng.pdf(model, null);
  const t = await extractPdfText(r.pdf!, pdfjs as any);
  return buildReport({ cv, model, text: t.text, pages: t.pages, plainText: toPlainText(model) });
}
const show = (label: string, r: Awaited<ReturnType<typeof report>>) => {
  console.log(`\n=== ${label}: ${r.score} (${r.grade}) ${r.verdict}`);
  console.log('   ' + r.categories.map((c) => `${c.label} ${c.score}`).join(' | '));
  for (const f of r.fixes) console.log(`   fix: [${f.level}] ${f.title}`);
};

const sample = await report(sampleCV());
show('Örnek CV', sample);
cond('sample ≥ 80', sample.score >= 80, sample.score);
for (const f of sample.findings.filter((x) => x.cat === 'parse')) cond(`sample parse ${f.id}`, f.level === 'ok', f.title);

for (const p of PROFESSIONS) {
  const r = await report(sampleFor(p.id));
  show(p.name, r);
  cond(`${p.id} ≥ 70`, r.score >= 70, r.score);
  cond(`${p.id} no parse error`, !r.findings.some((f) => f.cat === 'parse' && f.level === 'error'), r.findings.filter((f) => f.cat === 'parse' && f.level === 'error').map((f) => f.title));
}

// kasten zayıf CV
const bad = emptyCV('Zayıf');
bad.personal.firstName = 'Ali';
bad.personal.lastName = 'Veli';
bad.personal.email = 'kral1903@hotmail.com';
bad.sections.experience.push(
  newEntry({ position: 'Uzman', company: 'X', dates: { start: '2019-01', end: '2020-01', current: false }, bullets: ['Çeşitli işlerden sorumluydum.', 'Raporlar hazırlandı.'] }) as never,
  newEntry({ position: 'Uzman', company: 'Y', dates: { start: '2021-01', end: '', current: true }, bullets: ['Takım oyuncusu olarak projelerde görev aldım.'] }) as never,
);
bad.sections.skills.push(newEntry({ name: 'Beceriler', items: ['İletişim', 'Takım çalışması', 'Liderlik', 'Excel'] }) as never);
bad.summary = 'Çalışkan, dinamik ve sonuç odaklı biriyim.';
const rb = await report(bad);
show('Zayıf CV', rb);
cond('bad < 60', rb.score < 60, rb.score);
cond('bad chrono flagged', rb.findings.some((f) => f.id === 'l-chrono' && f.level === 'warn'));
cond('bad cliche flagged', rb.findings.some((f) => f.id === 'i-cliche' && f.level === 'warn'));
cond('bad email flagged', rb.findings.some((f) => f.id === 'c-email' && f.level === 'warn'));
cond('bad soft flagged', rb.findings.some((f) => f.id === 'k-soft'));
cond('bad weak verbs flagged', rb.findings.some((f) => f.id === 'i-verbs' && f.level === 'warn'));

// kritik: e-posta yok → tavan
const noMail = sampleCV();
noMail.personal.email = '';
const rn = await report(noMail);
cond('no email capped ≤ 49', rn.score <= 49 && rn.capped, rn.score);

// standart dışı başlık
const odd = sampleCV();
odd.titles.experience = 'Kariyer Yolculuğum';
const ro = await report(odd);
cond('nonstandard title flagged', ro.findings.some((f) => f.id === 'p-std' && f.level === 'warn'));

// buton bağlantılar
const btn = sampleCV();
btn.design.linkStyle = 'button';
const rbt = await report(btn);
cond('button links flagged', rbt.findings.some((f) => f.id === 'p-links' && f.level === 'warn'));

// İngilizce örnek: standart başlıklar tanınmalı, rol anahtar kelimeleri İngilizce olmalı
{
  const { sampleCVEn } = await import('../src/model/sample');
  const re = await report(sampleCVEn());
  show('İngilizce örnek', re);
  cond('en: başlıklar standart', re.findings.some((f) => f.id === 'p-std' && f.level === 'ok'), re.findings.find((f) => f.id === 'p-std')?.title);
  cond('en: rol İngilizce terimlerle', !(re.findings.find((f) => f.id === 'k-role')?.items ?? []).some((i) => /[çğışöü]/i.test(i.text)));
  cond('en ≥ 85', re.score >= 85, re.score);
}

// ilan
const job = sampleCV();
job.jobPosting = 'Bilgi İşlem Uzmanı arıyoruz. Active Directory, Intune, Azure, Terraform ve Kubernetes bilgisi olan, en az 3 yıl deneyimli, ITIL sertifikalı adaylar.';
const rj = await report(job);
cond('job finding present', rj.findings.some((f) => f.id === 'k-job'));

console.log(fail ? `\n${fail} test BAŞARISIZ` : '\nTüm rapor testleri geçti');
process.exit(fail ? 1 : 0);
