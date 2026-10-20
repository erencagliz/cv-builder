/**
 * Arayüz dili (CV dilinden bağımsız).
 *
 * Arayüz metinleri Türkçe yazılır; İngilizce seçiliyse sayfadaki metin düğümleri ve
 * title / placeholder / aria-label öznitelikleri sözlükten anında çevrilir. Böylece yeni eklenen
 * her metin otomatik çeviri kapsamına girer, kodda ayrı anahtar tutmak gerekmez.
 * CV önizlemesi, kullanıcının yazdığı alanlar ve ATS metni gibi içerik bölgeleri çevrilmez.
 * Sözlükte "{0}" gibi yer tutucular sayı ve isim gibi değişken parçaları yakalar.
 */
import { EN } from './en';

export type UiLang = 'tr' | 'en';
const KEY = 'ui-lang';

function initial(): UiLang {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'tr' || saved === 'en') return saved;
  } catch {
    /* depolama yoksa tarayıcı diline bak */
  }
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
  return langs.some((l) => /^tr\b/i.test(l)) || !langs.length ? 'tr' : 'en';
}

let lang: UiLang = typeof window === 'undefined' ? 'tr' : initial();
export const uiLang = () => lang;
export const uiLocale = () => (lang === 'en' ? 'en-GB' : 'tr-TR');

export function setUiLang(next: UiLang) {
  try {
    localStorage.setItem(KEY, next);
  } catch {
    /* yoksay */
  }
  // en sağlam yol: sayfayı yeniden yükle (React ağacı ve çeviri katmanı temiz başlar)
  location.reload();
}

/* ---------------- sözlük ---------------- */
const exact = new Map<string, string>();
const patterns: { re: RegExp; out: string }[] = [];
for (const [k, v] of Object.entries(EN)) {
  if (/\{\d+\}/.test(k)) {
    const re = new RegExp('^' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\{(\d+)\\\}/g, '(.+)') + '$', 's');
    patterns.push({ re, out: v });
  } else exact.set(k, v);
}
// en belirgin (sabit metni en uzun) kalıp önce denensin
patterns.sort((a, b) => b.re.source.replace(/\(\.\+\)/g, '').length - a.re.source.replace(/\(\.\+\)/g, '').length);
const cache = new Map<string, string | null>();

/** Tek bir metni çevirir; bulunamazsa null */
function lookup(s: string, depth = 0): string | null {
  if (!depth && cache.has(s)) return cache.get(s)!;
  let r: string | null = exact.get(s) ?? null;
  if (r === null) {
    for (const p of patterns) {
      const m = p.re.exec(s);
      if (m) {
        r = p.out.replace(/\{(\d+)\}/g, (_x, i) => {
          const v = m[+i + 1] ?? '';
          if (depth > 0) return v;
          return lookup(v, 1) ?? v.split(', ').map((part) => lookup(part, 1) ?? part).join(', ');
        });
        break;
      }
    }
  }
  // İngilizcede yüzde işareti sona gelir: %57 → 57%
  if (r !== null) r = r.replace(/%(\d+)/g, '$1%');
  if (!depth) {
    if (cache.size > 5000) cache.clear();
    cache.set(s, r);
  }
  return r;
}

/** Baştaki/sondaki boşlukları koruyarak çevirir */
export function translate(s: string): string {
  if (lang === 'tr' || !s) return s;
  const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(s)!;
  const core = m[2];
  if (!core || !/\p{L}/u.test(core)) return s;
  const r = lookup(core);
  return r === null ? s : m[1] + r + m[3];
}

/** Kodda doğrudan kullanmak için: t('{0} sayfa', 3) */
export function t(s: string, ...args: (string | number)[]): string {
  const filled = args.length ? s.replace(/\{(\d+)\}/g, (_x, i) => String(args[+i] ?? '')) : s;
  return translate(filled);
}

/* ---------------- DOM çeviri katmanı ---------------- */
const SKIP_SEL = '.page, .ats-text, .bl-text, .it-text, .g-svg, .qr, [data-no-i18n], [contenteditable="true"], script, style, noscript';
const ATTRS = ['title', 'placeholder', 'aria-label', 'alt'];

function skip(el: Element | null): boolean {
  return !!el?.closest(SKIP_SEL);
}
function translateNode(n: Node) {
  if (n.nodeType === Node.TEXT_NODE) {
    const p = n.parentElement;
    if (!p || p.tagName === 'TEXTAREA' || skip(p)) return;
    const v = n.nodeValue ?? '';
    const tr = translate(v);
    if (tr !== v) n.nodeValue = tr;
    return;
  }
  if (n.nodeType !== Node.ELEMENT_NODE) return;
  const el = n as Element;
  if (skip(el)) return;
  translateAttrs(el);
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode: (x) => (x.nodeType === Node.ELEMENT_NODE && (x as Element).matches(SKIP_SEL) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  for (let x = walker.nextNode(); x; x = walker.nextNode()) {
    if (x.nodeType === Node.TEXT_NODE) translateNode(x);
    else translateAttrs(x as Element);
  }
}
function translateAttrs(el: Element) {
  for (const a of ATTRS) {
    const v = el.getAttribute(a);
    if (v) {
      // "@…" anahtarları yalnızca özniteliklerde (yer tutucu gibi) çevrilir
      const at = lang === 'en' ? (exact.get('@' + v.trim()) ?? null) : null;
      const tr = at ?? translate(v);
      if (tr !== v) el.setAttribute(a, tr);
    }
  }
}

let started = false;
export function startDomTranslation(root: HTMLElement = document.body) {
  document.documentElement.lang = lang;
  if (lang === 'tr' || started) return;
  started = true;
  translateNode(root);
  new MutationObserver((list) => {
    for (const m of list) {
      if (m.type === 'characterData') translateNode(m.target);
      else if (m.type === 'attributes') {
        if (m.target.nodeType === Node.ELEMENT_NODE && !skip(m.target as Element)) translateAttrs(m.target as Element);
      } else m.addedNodes.forEach(translateNode);
    }
  }).observe(root, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  // sekme başlığı
  const fixTitle = () => {
    const tr = translate(document.title);
    if (tr !== document.title) document.title = tr;
  };
  fixTitle();
  const titleEl = document.querySelector('title');
  if (titleEl) new MutationObserver(fixTitle).observe(titleEl, { childList: true, characterData: true, subtree: true });
}

const EN_VALUES = new Set(Object.values(EN));
/** Test ve sözlük bakımı için: çevrilemeyen Türkçe metinleri toplar */
export function missingStrings(root: HTMLElement = document.body): string[] {
  const out = new Set<string>();
  const tr = /[çğıöşüÇĞİÖŞÜ]|\b(ve|bir|ile|için|yok|var|veya|gibi|ekle|seç|göster)\b/;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let x = walker.nextNode(); x; x = walker.nextNode()) {
    const p = x.parentElement;
    if (!p || skip(p) || p.tagName === 'TEXTAREA' || p.closest('option') && p.closest('select')?.matches('[data-no-i18n]')) continue;
    const v = (x.nodeValue ?? '').trim();
    if (v && tr.test(v) && !EN_VALUES.has(v)) out.add(v);
  }
  root.querySelectorAll('[title],[placeholder],[aria-label]').forEach((el) => {
    if (skip(el)) return;
    for (const a of ATTRS) {
      const v = el.getAttribute(a)?.trim();
      if (v && tr.test(v) && !EN_VALUES.has(v)) out.add(`@${a}: ${v}`);
    }
  });
  return [...out];
}
