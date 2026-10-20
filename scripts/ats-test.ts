import fs from 'fs';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { TypstEngine } from '../src/render/engine';
import { buildModel } from '../src/render/buildModel';
import { sampleCV } from '../src/model/sample';
import { extractPdfText } from '../src/ats/pdfText';
import { atsChecks } from '../src/ats/analyze';
import { qualityChecks, score } from '../src/ats/quality';
const nm = 'node_modules/@myriaddreamin/';
const eng = new TypstEngine({
  compilerWasm: () => fs.readFileSync(nm + 'typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm'),
  rendererWasm: () => fs.readFileSync(nm + 'typst-ts-renderer/pkg/typst_ts_renderer_bg.wasm'),
  loadFile: async (p) => new Uint8Array(fs.readFileSync('public/' + p)),
});
for (const style of ['url', 'button'] as const) {
  const cv = sampleCV();
  cv.design.linkStyle = style;
  const model = buildModel(cv);
  const r = await eng.pdf(model, null);
  const t = await extractPdfText(r.pdf!, pdfjs as any);
  if (style === 'url') console.log(t.text.slice(0, 600));
  console.log('--- ATS', style);
  for (const c of atsChecks(t.text, cv, model)) console.log(c.level, c.title);
  const q = qualityChecks(cv, t.pages);
  console.log('--- quality score', score(q));
  for (const c of q) console.log(c.level, c.title);
}
