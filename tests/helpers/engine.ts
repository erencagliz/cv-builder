import fs from 'node:fs';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { TypstEngine } from '../../src/render/engine';
import { buildModel } from '../../src/render/buildModel';
import { extractPdfText } from '../../src/ats/pdfText';
import type { CV } from '../../src/model/types';

const pkg = 'node_modules/@myriaddreamin/';

let engine: TypstEngine | null = null;

export function getEngine(): TypstEngine {
  engine ??= new TypstEngine({
    compilerWasm: () => fs.readFileSync(`${pkg}typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm`),
    rendererWasm: () => fs.readFileSync(`${pkg}typst-ts-renderer/pkg/typst_ts_renderer_bg.wasm`),
    loadFile: async (path) => new Uint8Array(fs.readFileSync(`public/${path}`)),
  });
  return engine;
}

export async function renderPdf(cv: CV): Promise<Uint8Array> {
  const result = await getEngine().pdf(buildModel(cv), null);
  if (!result.pdf) throw new Error(`Typst compilation failed: ${result.diagnostics.join('\n')}`);
  return result.pdf;
}

export const readPdf = (bytes: Uint8Array) => extractPdfText(bytes, pdfjs as never);
