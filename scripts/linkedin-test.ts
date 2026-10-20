import fs from 'fs';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createTypstCompiler, createTypstFontBuilder } from '@myriaddreamin/typst.ts/compiler';
import { disableDefaultFontAssets } from '@myriaddreamin/typst.ts/options.init';
import { extractPdfText } from '../src/ats/pdfText';
import { parseLinkedIn } from '../src/import/linkedin';
const wasm = fs.readFileSync('node_modules/@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm');
const c = createTypstCompiler();
await c.init({ beforeBuild: [disableDefaultFontAssets()], getModule: () => wasm });
const fb = createTypstFontBuilder(); await fb.init({ getModule: () => wasm });
for (const s of ['regular', 'bold']) await fb.addFontData(new Uint8Array(fs.readFileSync(`public/fonts/roboto/${s}.ttf`)));
await fb.build(async (r) => c.setFonts(r));
c.addSource('/main.typ', fs.readFileSync(process.argv[2] || '/tmp/claude-0/li/linkedin.typ', 'utf8'));
const r = await c.compile({ mainFilePath: '/main.typ', format: 1, diagnostics: 'unix' });
if (!r.result) { console.log(r.diagnostics); process.exit(1); }
const t = await extractPdfText(r.result, pdfjs as any);
const { cv, found } = parseLinkedIn(t);
console.log(found);
console.log(JSON.stringify({ personal: { f: cv.personal.firstName, l: cv.personal.lastName, t: cv.personal.title, loc: cv.personal.location, e: cv.personal.email, p: cv.personal.phone }, links: cv.links, summary: cv.summary, exp: cv.sections.experience.map(({ id, ...e }) => e), edu: cv.sections.education.map(({ id, ...e }) => e), skills: cv.sections.skills[0]?.items, langs: cv.sections.languages.map((l) => [l.language, l.level]), certs: cv.sections.certificates.map((x) => x.name) }, null, 1));
