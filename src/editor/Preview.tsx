import { useEffect, useMemo, useRef, useState } from 'react';
import type { CV } from '../model/types';
import { buildModel, buildLetterModel } from '../render/buildModel';
import { renderSvg, dataUrlToBytes } from '../render/client';
import { Icon } from '../ui/fields';

interface Page {
  svg: string;
  width: number;
  height: number;
}

/** Typst tüm sayfaları tek SVG'de alt alta çizer; her sayfayı ayrı viewBox ile gösteriyoruz. */
function splitPages(svg: string, pages: { width: number; height: number }[]): Page[] {
  let y = 0;
  return pages.map((p) => {
    const vb = `0 ${y.toFixed(3)} ${p.width.toFixed(3)} ${p.height.toFixed(3)}`;
    y += p.height;
    const out = svg.replace(/<svg([^>]*?)viewBox="[^"]*"([^>]*?)width="[^"]*"([^>]*?)height="[^"]*"/, (_m, a, b, c) => `<svg${a}viewBox="${vb}"${b}width="100%"${c}height="100%"`);
    return { svg: out, width: p.width, height: p.height };
  });
}

export function Preview({
  cv,
  onStatus,
  letter = false,
  onFit,
  fitting = false,
}: {
  cv: CV;
  onStatus?: (s: { pages: number; error: string }) => void;
  letter?: boolean;
  onFit?: () => void;
  fitting?: boolean;
}) {
  const [pages, setPages] = useState<Page[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [firstLoad, setFirstLoad] = useState(true);
  const [zoom, setZoom] = useState<number | 'fit'>('fit');
  const [fitWidth, setFitWidth] = useState(600);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inflight = useRef(false);
  const queued = useRef<(CV & { __letter?: boolean }) | null>(null);
  const photoCache = useRef<{ url: string; bytes: Uint8Array | null }>({ url: '', bytes: null });

  // Ekran genişliğine sığdır
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setFitWidth(Math.max(260, Math.min(el.clientWidth - 48, 900))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const run = useMemo(
    () => async (doc: CV & { __letter?: boolean }) => {
      if (inflight.current) {
        queued.current = doc;
        return;
      }
      inflight.current = true;
      setBusy(true);
      try {
        const model = doc.__letter ? buildLetterModel(doc) : buildModel(doc);
        if (photoCache.current.url !== doc.personal.photo) {
          photoCache.current = { url: doc.personal.photo, bytes: dataUrlToBytes(doc.personal.photo) };
        }
        const res = await renderSvg(model, photoCache.current.bytes ? photoCache.current.bytes.slice() : null);
        if (res.svg) {
          const ps = splitPages(res.svg, res.pages);
          setPages(ps);
          setError('');
          onStatus?.({ pages: ps.length, error: '' });
        } else {
          const msg = res.diagnostics[0] ?? 'Önizleme oluşturulamadı.';
          setError(msg);
          onStatus?.({ pages: 0, error: msg });
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
        onStatus?.({ pages: 0, error: msg });
      } finally {
        inflight.current = false;
        setBusy(false);
        setFirstLoad(false);
        const next = queued.current;
        queued.current = null;
        if (next) run(next);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    const t = setTimeout(() => run({ ...cv, __letter: letter }), 120);
    return () => clearTimeout(t);
  }, [cv, run, letter]);

  const pageW = zoom === 'fit' ? fitWidth : Math.round(595 * zoom);
  const zoomPct = Math.round((pageW / 595) * 100);
  const step = (dir: number) => {
    const cur = pageW / 595;
    const next = Math.min(2.5, Math.max(0.4, Math.round((cur + dir * 0.1) * 10) / 10));
    setZoom(next);
  };

  return (
    <div className="preview" ref={wrapRef}>
      <div className="preview-bar">
        <span className={`status${busy ? ' busy' : ''}${error ? ' err' : ''}`} aria-live="polite">
          {firstLoad ? 'Dizgi motoru yükleniyor…' : error ? 'Önizleme hatası' : busy ? 'Güncelleniyor…' : `${pages.length} sayfa`}
        </span>
        {pages.length > 1 && !firstLoad && !letter && onFit && (
          <button type="button" className="btn ghost sm" onClick={onFit} disabled={fitting} title="Yazı boyutunu ve boşlukları okunabilir sınırlar içinde küçültür">
            <Icon name="shrink" /> {fitting ? 'Sığdırılıyor…' : 'Tek sayfaya sığdır'}
          </button>
        )}
        {pages.length > 2 && !firstLoad && !letter && <span className="pill warn">Çoğu ilan için 1-2 sayfa idealdir</span>}
        <div className="zoom">
          <button type="button" className="icon-btn" aria-label="Uzaklaştır" onClick={() => step(-1)}>
            <Icon name="zoomout" />
          </button>
          <button type="button" className="zoom-val" onClick={() => setZoom('fit')} title="Ekrana sığdır">
            {zoomPct}%
          </button>
          <button type="button" className="icon-btn" aria-label="Yakınlaştır" onClick={() => step(1)}>
            <Icon name="zoomin" />
          </button>
        </div>
      </div>
      <div className="pages">
        {firstLoad && !pages.length && (
          <div className="page skeleton" style={{ width: pageW, aspectRatio: '595 / 842' }}>
            <div className="sk-lines">
              <span style={{ width: '45%' }} />
              <span style={{ width: '30%' }} />
              <span style={{ width: '80%' }} />
              <span style={{ width: '100%' }} />
              <span style={{ width: '92%' }} />
            </div>
            <p className="sk-note">Dizgi motoru ilk açılışta indiriliyor, sonraki açılışlar anında olur.</p>
          </div>
        )}
        {error && (
          <div className="note warn preview-error" role="alert">
            <Icon name="alert" size={14} /> {error}
          </div>
        )}
        {pages.map((p, i) => (
          <div key={i} className="page-wrap">
            <div className="page" style={{ width: pageW, aspectRatio: `${p.width} / ${p.height}` }} dangerouslySetInnerHTML={{ __html: p.svg }} />
            {pages.length > 1 && <div className="page-num">Sayfa {i + 1}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
