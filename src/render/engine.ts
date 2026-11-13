import { createTypstCompiler, createTypstFontBuilder, type TypstCompiler } from '@myriaddreamin/typst.ts/compiler';
import { createTypstRenderer, type TypstRenderer } from '@myriaddreamin/typst.ts/renderer';
import { disableDefaultFontAssets } from '@myriaddreamin/typst.ts/options.init';
import fonts from './fonts.json';
import template from './cv.typ?raw';
import type { RenderModel } from './buildModel';

type Bytes = Uint8Array;
export interface EngineDeps {
  compilerWasm: () => Promise<ArrayBuffer | Bytes> | ArrayBuffer | Bytes;
  rendererWasm: () => Promise<ArrayBuffer | Bytes> | ArrayBuffer | Bytes;
  loadFile: (path: string) => Promise<Bytes>;
}

export interface SvgResult {
  svg: string;
  pages: { width: number; height: number }[];
  diagnostics: string[];
}

const FONT_LIST = fonts as { id: string; family: string; files: Record<string, string> }[];

export class TypstEngine {
  private compiler?: TypstCompiler;
  private renderer?: TypstRenderer;
  private ready?: Promise<void>;
  private fontBytes = new Map<string, Bytes[]>();
  private activeFonts = '';
  private compilerModule?: ArrayBuffer | Bytes;

  private deps: EngineDeps;
  constructor(deps: EngineDeps) {
    this.deps = deps;
  }

  init(): Promise<void> {
    this.ready ??= (async () => {
      this.compilerModule = await this.deps.compilerWasm();
      const c = createTypstCompiler();
      await c.init({ beforeBuild: [disableDefaultFontAssets()], getModule: () => this.compilerModule! });
      c.addSource('/main.typ', template);
      this.compiler = c;
    })().catch((e) => {
      this.ready = undefined;
      throw e;
    });
    return this.ready;
  }

  private async ensureRenderer() {
    if (!this.renderer) {
      const mod = await this.deps.rendererWasm();
      const r = createTypstRenderer();
      await r.init({ getModule: () => mod });
      this.renderer = r;
    }
    return this.renderer;
  }

  private async ensureFonts(ids: string[]) {
    const wanted = [...new Set(ids)].filter((id) => FONT_LIST.some((f) => f.id === id));
    for (const id of wanted) {
      if (this.fontBytes.has(id)) continue;
      const def = FONT_LIST.find((f) => f.id === id)!;
      const files = await Promise.all(Object.values(def.files).map((p) => this.deps.loadFile(`fonts/${p}`)));
      this.fontBytes.set(id, files);
    }
    const key = [...this.fontBytes.keys()].sort().join(',');
    if (key === this.activeFonts) return;
    const fb = createTypstFontBuilder();
    await fb.init({ getModule: () => this.compilerModule! });
    for (const files of this.fontBytes.values()) for (const f of files) await fb.addFontData(f);
    await fb.build(async (resolver) => this.compiler!.setFonts(resolver));
    this.activeFonts = key;
  }

  private async prepare(model: RenderModel, photo: Bytes | null) {
    await this.init();
    await this.ensureFonts([model.design.fonts.heading, model.design.fonts.body]);
    const c = this.compiler!;
    c.mapShadow('/data.json', new TextEncoder().encode(JSON.stringify(model)));
    if (photo && model.header.photo) c.mapShadow('/photo.jpg', photo);
    else {
      try {
        c.unmapShadow('/photo.jpg');
      } catch {
      }
      if (model.header.photo) model.header.photo = false;
    }
    return c;
  }

  async pdf(model: RenderModel, photo: Bytes | null): Promise<{ pdf?: Bytes; diagnostics: string[] }> {
    const c = await this.prepare(model, photo);
    const r = await c.compile({ mainFilePath: '/main.typ', format: 1, diagnostics: 'unix' });
    return { pdf: r.result, diagnostics: (r.diagnostics as string[] | undefined) ?? [] };
  }

  async pages(model: RenderModel, photo: Bytes | null): Promise<number> {
    const c = await this.prepare(model, photo);
    const r = await c.compile({ mainFilePath: '/main.typ', format: 0, diagnostics: 'unix' });
    if (!r.result) return 0;
    const renderer = await this.ensureRenderer();
    return renderer.runWithSession({ format: 'vector', artifactContent: r.result }, async (s) => s.retrievePagesInfo().length);
  }

  async svg(model: RenderModel, photo: Bytes | null): Promise<SvgResult> {
    const c = await this.prepare(model, photo);
    const r = await c.compile({ mainFilePath: '/main.typ', format: 0, diagnostics: 'unix' });
    const diagnostics = (r.diagnostics as string[] | undefined) ?? [];
    if (!r.result) return { svg: '', pages: [], diagnostics };
    const renderer = await this.ensureRenderer();
    return renderer.runWithSession({ format: 'vector', artifactContent: r.result }, async (session) => {
      const pages = session.retrievePagesInfo().map((p) => ({ width: p.width, height: p.height }));
      const svg = await renderer.renderSvg({ renderSession: session });
      return { svg, pages, diagnostics };
    });
  }
}
