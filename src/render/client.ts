import { useSyncExternalStore } from 'react';
import type { RenderModel } from './buildModel';
import type { SvgResult } from './engine';

/**
 * Dizgi motoru (Web Worker) istemcisi. Kendi kendini onarır:
 *  - motor çökerse veya bir istek takılırsa worker kapatılıp yenisi açılır ve istek bir kez yeniden denenir
 *  - ilk yükleme başarısız olursa artan aralıklarla yeniden denenir
 *  - indirme ilerlemesi arayüze yayınlanır
 */
type Pending = { resolve: (v: any) => void; reject: (e: Error) => void; timer: ReturnType<typeof setTimeout> };
let worker: Worker | null = null;
let seq = 0;
const pending = new Map<number, Pending>();

export interface EngineStatus {
  state: 'idle' | 'loading' | 'ready' | 'error';
  loaded: number;
  total: number;
  error?: string;
}
let status: EngineStatus = { state: 'idle', loaded: 0, total: 0 };
const listeners = new Set<() => void>();
const setStatus = (s: Partial<EngineStatus>) => {
  status = { ...status, ...s };
  listeners.forEach((l) => l());
};
export const useEngineStatus = () =>
  useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => status,
  );

function killWorker(reason: string) {
  worker?.terminate();
  worker = null;
  for (const p of pending.values()) {
    clearTimeout(p.timer);
    p.reject(new Error(reason));
  }
  pending.clear();
  if (status.state === 'ready') setStatus({ state: 'idle' });
}

function getWorker() {
  if (!worker) {
    const w = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    w.onmessage = (ev) => {
      const d = ev.data;
      if (d.type === 'progress') {
        setStatus({ loaded: d.loaded, total: d.total });
        return;
      }
      const p = pending.get(d.id);
      if (!p) return;
      pending.delete(d.id);
      clearTimeout(p.timer);
      if (d.ok) p.resolve(d.result);
      else p.reject(new Error(d.error));
    };
    w.onerror = (ev) => {
      ev.preventDefault?.();
      killWorker(ev.message || 'Dizgi motoru beklenmedik şekilde durdu.');
    };
    worker = w;
  }
  return worker;
}

class EngineCrash extends Error {}

function callOnce<T>(msg: Record<string, unknown>, timeoutMs: number): Promise<T> {
  const id = ++seq;
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      // takılan motor: yeniden başlat
      killWorker('Dizgi motoru yanıt vermedi; yeniden başlatıldı.');
      reject(new EngineCrash('timeout'));
    }, timeoutMs);
    pending.set(id, { resolve, reject: (e) => reject(e instanceof EngineCrash ? e : e), timer });
    try {
      getWorker().postMessage({ ...msg, id });
    } catch (e) {
      clearTimeout(timer);
      pending.delete(id);
      reject(e instanceof Error ? e : new Error(String(e)));
    }
  });
}

let initPromise: Promise<void> | null = null;
/** Motoru yükler; başarısız olursa 4 kez artan aralıkla yeniden dener. */
export function initEngine(): Promise<void> {
  if (status.state === 'ready' && worker) return Promise.resolve();
  initPromise ??= (async () => {
    setStatus({ state: 'loading', error: undefined });
    let last: unknown;
    for (let i = 0; i < 5; i++) {
      try {
        await callOnce<void>({ type: 'init' }, 180_000);
        setStatus({ state: 'ready' });
        return;
      } catch (e) {
        last = e;
        killWorker('yeniden deneniyor');
        await new Promise((r) => setTimeout(r, 1000 * 2 ** i));
      }
    }
    const msg = last instanceof Error ? last.message : String(last);
    setStatus({ state: 'error', error: msg });
    throw new Error(`Dizgi motoru yüklenemedi: ${msg}`);
  })().finally(() => {
    initPromise = null;
  });
  return initPromise;
}

/** Çizim istekleri: motor hazır değilse önce yüklenir; motor çökerse bir kez yeniden denenir. */
async function call<T>(msg: Record<string, unknown>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    await initEngine();
    try {
      return await callOnce<T>(msg, 60_000);
    } catch (e) {
      const crashed = !worker; // killWorker çağrıldıysa
      if (attempt >= 1 || !crashed) throw e instanceof Error ? e : new Error(String(e));
    }
  }
}

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
