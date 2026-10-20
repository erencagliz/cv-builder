import type { RenderModel } from './buildModel';
import type { SvgResult } from './engine';

type Pending = { resolve: (v: any) => void; reject: (e: Error) => void };
let worker: Worker | null = null;
let seq = 0;
const pending = new Map<number, Pending>();

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (ev) => {
      const { id, ok, result, error } = ev.data;
      const p = pending.get(id);
      if (!p) return;
      pending.delete(id);
      if (ok) p.resolve(result);
      else p.reject(new Error(error));
    };
    worker.onerror = (ev) => {
      for (const p of pending.values()) p.reject(new Error(ev.message || 'Motor hatası'));
      pending.clear();
    };
  }
  return worker;
}

function call<T>(msg: Record<string, unknown>): Promise<T> {
  const id = ++seq;
  return new Promise<T>((resolve, reject) => {
    pending.set(id, { resolve, reject });
    getWorker().postMessage({ ...msg, id });
  });
}

export const initEngine = () => call<void>({ type: 'init' });
export const renderSvg = (model: RenderModel, photo: Uint8Array | null) => call<SvgResult>({ type: 'svg', model, photo });
export const renderPdf = (model: RenderModel, photo: Uint8Array | null) =>
  call<{ pdf?: Uint8Array; diagnostics: string[] }>({ type: 'pdf', model, photo });

export const countPages = (model: RenderModel, photo: Uint8Array | null) => call<number>({ type: 'pages', model, photo });

/** data:image/jpeg;base64,... → bytes */
export function dataUrlToBytes(url: string): Uint8Array | null {
  const m = /^data:[^;]+;base64,(.*)$/.exec(url);
  if (!m) return null;
  const bin = atob(m[1]);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
