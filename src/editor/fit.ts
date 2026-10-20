import type { CV, Design } from '../model/types';
import { buildModel } from '../render/buildModel';

/** Okunabilirlik sınırları: bunların altına inilmez */
const MIN = { body: 8.5, meta: 7.5, entryTitle: 8.5, heading: 9, title: 9.5, name: 16, leading: 0.4, margin: 10 };

/** Tasarımı f oranında sıkıştırır (1 = değişmez) */
export function scaleDesign(d: Design, f: number): Design {
  const r1 = (v: number) => Math.round(v * 10) / 10;
  const sz = (v: number, min: number) => Math.max(min, r1(v * f));
  const gap = (v: number) => r1(v * (f * f)); // boşluklar yazıdan daha hızlı küçülür
  return {
    ...d,
    sizes: {
      name: sz(d.sizes.name, MIN.name),
      title: sz(d.sizes.title, MIN.title),
      heading: sz(d.sizes.heading, MIN.heading),
      entryTitle: sz(d.sizes.entryTitle, MIN.entryTitle),
      body: sz(d.sizes.body, MIN.body),
      meta: sz(d.sizes.meta, MIN.meta),
    },
    leading: Math.max(MIN.leading, Math.round(d.leading * (0.5 + f / 2) * 100) / 100),
    paragraphGap: gap(d.paragraphGap),
    sectionGap: gap(d.sectionGap),
    headingGap: gap(d.headingGap),
    entryGap: gap(d.entryGap),
    bulletGap: gap(d.bulletGap),
    margins: {
      top: Math.max(MIN.margin, r1(d.margins.top * f)),
      bottom: Math.max(MIN.margin, r1(d.margins.bottom * f)),
      left: Math.max(MIN.margin, r1(d.margins.left * f)),
      right: Math.max(MIN.margin, r1(d.margins.right * f)),
    },
  };
}

/**
 * En az küçültmeyle tek sayfaya sığan tasarımı ikili aramayla bulur.
 * Sığmıyorsa null döner (içerik kısaltılmalı).
 */
export async function fitToOnePage(cv: CV, count: (cv: CV) => Promise<number>): Promise<{ design: Design; factor: number } | null> {
  if ((await count(cv)) <= 1) return { design: cv.design, factor: 1 };
  const lo0 = 0.6;
  const atMin = { ...cv, design: scaleDesign(cv.design, lo0) };
  if ((await count(atMin)) > 1) return null;
  let lo = lo0;
  let hi = 1;
  for (let i = 0; i < 7; i++) {
    const mid = (lo + hi) / 2;
    const n = await count({ ...cv, design: scaleDesign(cv.design, mid) });
    if (n <= 1) lo = mid;
    else hi = mid;
  }
  return { design: scaleDesign(cv.design, lo), factor: lo };
}

export const modelFor = buildModel;
