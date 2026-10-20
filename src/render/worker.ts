/// <reference lib="webworker" />
import compilerWasmUrl from '@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm?url';
import rendererWasmUrl from '@myriaddreamin/typst-ts-renderer/pkg/typst_ts_renderer_bg.wasm?url';
import { TypstEngine } from './engine';
import type { RenderModel } from './buildModel';

const base = new URL(import.meta.env.BASE_URL, self.location.origin).href;
const fetchBytes = async (url: string) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} yüklenemedi (${r.status})`);
  return new Uint8Array(await r.arrayBuffer());
};
const engine = new TypstEngine({
  compilerWasm: () => fetchBytes(compilerWasmUrl),
  rendererWasm: () => fetchBytes(rendererWasmUrl),
  loadFile: (p) => fetchBytes(base + p),
});

export type WorkerRequest =
  | { id: number; type: 'init' }
  | { id: number; type: 'svg' | 'pdf' | 'pages'; model: RenderModel; photo: Uint8Array | null };

self.onmessage = async (ev: MessageEvent<WorkerRequest>) => {
  const msg = ev.data;
  try {
    if (msg.type === 'init') {
      await engine.init();
      self.postMessage({ id: msg.id, ok: true });
    } else if (msg.type === 'pages') {
      self.postMessage({ id: msg.id, ok: true, result: await engine.pages(msg.model, msg.photo) });
    } else if (msg.type === 'svg') {
      const r = await engine.svg(msg.model, msg.photo);
      self.postMessage({ id: msg.id, ok: true, result: r });
    } else {
      const r = await engine.pdf(msg.model, msg.photo);
      self.postMessage({ id: msg.id, ok: true, result: r }, r.pdf ? [r.pdf.buffer] : []);
    }
  } catch (e) {
    self.postMessage({ id: msg.id, ok: false, error: e instanceof Error ? e.message : String(e) });
  }
};
