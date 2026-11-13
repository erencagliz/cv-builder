import type { CV } from '../model/types';
import { emptyCV, normalizeCV } from '../model/defaults';
import { buildPath, type Lang } from '../routes';

const VERSION = '1';
type J = unknown;
const isObj = (v: J): v is Record<string, J> => !!v && typeof v === 'object' && !Array.isArray(v);

function diff(a: J, b: J): J | undefined {
  if (JSON.stringify(a) === JSON.stringify(b)) return undefined;
  if (isObj(a) && isObj(b)) {
    const out: Record<string, J> = {};
    for (const k of Object.keys(b)) {
      const d = diff(a[k], b[k]);
      if (d !== undefined) out[k] = d;
    }
    return Object.keys(out).length ? out : undefined;
  }
  return stripIds(b);
}
function stripIds(v: J): J {
  if (Array.isArray(v)) return v.map(stripIds);
  if (isObj(v)) {
    const out: Record<string, J> = {};
    for (const [k, x] of Object.entries(v)) {
      if (k === 'id' && typeof x === 'string') continue;
      out[k] = stripIds(x);
    }
    return out;
  }
  return v;
}
function merge(base: J, over: J): J {
  if (isObj(base) && isObj(over)) {
    const out: Record<string, J> = { ...base };
    for (const [k, v] of Object.entries(over)) out[k] = merge(base[k], v);
    return out;
  }
  return over === undefined ? base : over;
}

const b64url = (bytes: Uint8Array) => {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const unb64url = (s: string) => {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};
async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const res = new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(stream));
  return new Uint8Array(await res.arrayBuffer());
}

export interface ShareOptions {
  photo: boolean;
}

export async function encodeCV(cv: CV, opt: ShareOptions = { photo: false }): Promise<string> {
  const src: CV = structuredClone(cv);
  src.jobPosting = '';
  src.coverLetter = emptyCV().coverLetter;
  if (!opt.photo) {
    src.personal.photo = '';
    src.personal.showPhoto = false;
  }
  const base = emptyCV();
  const slim = (diff({ ...base, id: '', name: '', createdAt: 0, updatedAt: 0 }, { ...src, id: '', createdAt: 0, updatedAt: 0 }) ?? {}) as Record<string, J>;
  const json = new TextEncoder().encode(JSON.stringify(slim));
  return `${VERSION}.${b64url(await pipe(json, new CompressionStream('deflate-raw')))}`;
}

export async function decodeCV(hash: string): Promise<CV> {
  const raw = hash.replace(/^#/, '');
  const dot = raw.indexOf('.');
  if (dot < 0 || raw.slice(0, dot) !== VERSION) throw new Error('Bağlantı tanınmadı.');
  let slim: J;
  try {
    const bytes = await pipe(unb64url(raw.slice(dot + 1)), new DecompressionStream('deflate-raw'));
    slim = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new Error('Bağlantı bozuk ya da eksik kopyalanmış.');
  }
  const base = emptyCV();
  const cv = normalizeCV(merge(base, slim));
  cv.id = base.id;
  cv.createdAt = cv.updatedAt = Date.now();
  return cv;
}

export const shareUrl = (code: string, lang: Lang) => `${location.origin}${buildPath({ name: 'view', lang })}#${code}`;
