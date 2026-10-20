// Örnek PDF üretir: npx vite-node scripts/render-sample.ts [şablon,şablon] [çıktı klasörü]
import fs from 'fs';
import { TypstEngine } from '../src/render/engine';
import { buildModel } from '../src/render/buildModel';
import { sampleCV } from '../src/model/sample';
import { applyTemplate } from '../src/model/templates';
const nm = 'node_modules/@myriaddreamin/';
const eng = new TypstEngine({
  compilerWasm: () => fs.readFileSync(nm + 'typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm'),
  rendererWasm: () => fs.readFileSync(nm + 'typst-ts-renderer/pkg/typst_ts_renderer_bg.wasm'),
  loadFile: async (p) => new Uint8Array(fs.readFileSync('public/' + p)),
});
const out = process.argv[3] || 'sample-output';
fs.mkdirSync(out, { recursive: true });
for (const t of (process.argv[2] || 'signature').split(',')) {
  const cv = sampleCV();
  if (t !== 'default') cv.design = applyTemplate(cv.design, t);
  const r = await eng.pdf(buildModel(cv), null);
  if (r.diagnostics.length) console.log(t, r.diagnostics);
  if (r.pdf) fs.writeFileSync(`${out}/${t}.pdf`, r.pdf);
}
