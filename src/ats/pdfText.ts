/** PDF'ten metni, ATS'lerin çoğunun yaptığı gibi içerik akışı sırasıyla çıkarır. */
export interface TextItem {
  str: string;
  x: number;
  y: number;
  size: number;
  width: number;
  page: number;
  eol: boolean;
}
export interface PdfText {
  text: string;
  items: TextItem[];
  pages: number;
  pageWidth: number;
}

type PdfJs = typeof import('pdfjs-dist');
let lib: Promise<PdfJs> | null = null;

/** Tarayıcıda pdf.js'i ilk kullanımda yükler */
export function loadPdfJs(): Promise<PdfJs> {
  lib ??= (async () => {
    const pdfjs = await import('pdfjs-dist');
    const worker = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
    pdfjs.GlobalWorkerOptions.workerSrc = worker;
    return pdfjs;
  })();
  return lib;
}

export async function extractPdfText(data: Uint8Array, pdfjs?: PdfJs): Promise<PdfText> {
  const lib = pdfjs ?? (await loadPdfJs());
  const task = lib.getDocument({ data: data.slice(), useSystemFonts: false });
  const doc = await task.promise;
  const items: TextItem[] = [];
  let text = '';
  let pageWidth = 595;
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    pageWidth = page.view[2] - page.view[0];
    const content = await page.getTextContent();
    for (const it of content.items) {
      if (!('str' in it)) continue;
      const [a, b, , , e, f] = it.transform as number[];
      const size = Math.hypot(a, b);
      items.push({ str: it.str, x: e, y: f, size, width: it.width, page: p, eol: it.hasEOL });
      text += it.str + (it.hasEOL ? '\n' : '');
    }
    text += '\n';
  }
  await task.destroy();
  return { text: text.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim(), items, pages: doc.numPages, pageWidth };
}
