/// <reference lib="webworker" />
import compilerWasmUrl from '@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm?url';
import rendererWasmUrl from '@myriaddreamin/typst-ts-renderer/pkg/typst_ts_renderer_bg.wasm?url';
import { TypstEngine } from './engine';
import type { RenderModel } from './buildModel';

declare const __COMPILER_WASM_SIZE__: number;
const base = new URL(import.meta.env.BASE_URL, self.location.origin).href;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchBytes(url: string, progress = false): Promise<Uint8Array> {
  let last: unknown;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const r = await fetch(url, attempt >= 2 ? { cache: 'reload' } : undefined);
      if (!r.ok) throw new Error(`${url} yüklenemedi (${r.status})`);
      if (!progress || !r.body) return new Uint8Array(await r.arrayBuffer());
      const len = Number(r.headers.get('content-length')) || 0;
      const total = r.headers.get('content-encoding') || !len ? __COMPILER_WASM_SIZE__ : len;
      const reader = r.body.getReader();
      const chunks: Uint8Array[] = [];
      let loaded = 0;
      let lastPost = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        loaded += value.length;
        const now = Date.now();
        if (now - lastPost > 120) {
          lastPost = now;
          self.postMessage({ type: 'progress', loaded, total: Math.max(total, loaded) });
        }
      }
      self.postMessage({ type: 'progress', loaded, total: loaded });
      const out = new Uint8Array(loaded);
      let o = 0;
      for (const c of chunks) {
        out.set(c, o);
        o += c.length;
      }
      return out;
    } catch (e) {
      last = e;
      await sleep(600 * 2 ** attempt);
    }
  }
  throw last instanceof Error ? last : new Error(String(last));
}

const engine = new TypstEngine({
  compilerWasm: () => fetchBytes(compilerWasmUrl, true),
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
