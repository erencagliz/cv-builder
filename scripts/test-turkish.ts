/**
 * Plan §12: Her şablon × her yazı tipi için PDF üretir, metni pdftotext ile geri okur
 * ve Türkçe karakterlerin birebir çıktığını doğrular.
 * Çalıştırma: npx vite-node scripts/test-turkish.ts
 */
import fs from 'fs';
import { execFileSync } from 'child_process';
import { TypstEngine } from '../src/render/engine';
import { buildModel } from '../src/render/buildModel';
import { sampleCV } from '../src/model/sample';
import { applyTemplate, TEMPLATES } from '../src/model/templates';
import fonts from '../src/render/fonts.json';

const nm = 'node_modules/@myriaddreamin/';
const eng = new TypstEngine({
  compilerWasm: () => fs.readFileSync(nm + 'typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm'),
  rendererWasm: () => fs.readFileSync(nm + 'typst-ts-renderer/pkg/typst_ts_renderer_bg.wasm'),
  loadFile: async (p) => new Uint8Array(fs.readFileSync('public/' + p)),
});
const MUST = ['Çağrı Şükrü Öztürk', 'IĞDIR İSTANBUL ığşçöü', 'İŞ DENEYİMİ', 'EĞİTİM', 'linkedin.com/in/denizyilmaz', 'Group Policy', 'Askerlik Durumu: Yapıldı'];
const tmp = fs.mkdtempSync('/tmp/cvtest-');
let fail = 0, n = 0;
const norm = (s: string) => s.replace(/\s+/g, ' ');
for (const t of TEMPLATES) {
  for (const f of fonts as { id: string }[]) {
    const cv = sampleCV();
    cv.design = applyTemplate(cv.design, t.id);
    cv.design.headingCase = 'upper';
    if (process.env.TRACK) cv.design.headingTracking = parseFloat(process.env.TRACK);
    cv.design.fonts = { heading: f.id, body: f.id };
    cv.personal.firstName = 'Çağrı Şükrü';
    cv.personal.lastName = 'Öztürk';
    cv.personal.location = 'IĞDIR İSTANBUL ığşçöü';
    const r = await eng.pdf(buildModel(cv), null);
    const file = `${tmp}/${t.id}-${f.id}.pdf`;
    fs.writeFileSync(file, r.pdf!);
    const text = norm(execFileSync('pdftotext', [file, '-']).toString());
    const missing = MUST.filter((m) => !text.includes(m) && !text.includes(m.toLocaleUpperCase('tr-TR')));
    n++;
    if (missing.length) {
      fail++;
      console.log(`✗ ${t.id} × ${f.id}: eksik → ${missing.join(' | ')}`);
    }
  }
}
console.log(`${n - fail}/${n} kombinasyon geçti.`);
process.exit(fail ? 1 : 0);
