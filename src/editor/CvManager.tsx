import { useEffect, useRef, useState } from 'react';
import type { CV } from '../model/types';
import { listCVs, saveCV, deleteCV, getCV, type CVRow } from '../store/db';
import { emptyCV, uid } from '../model/defaults';
import { importAny } from '../model/io';
import { PROFESSIONS } from '../content/professions';
import { sampleFor } from '../content/gallery';
import { buildModel } from '../render/buildModel';
import { renderSvg } from '../render/client';
import { flushSave } from '../store/editor';
import { navigate, useToast } from '../ui/app';
import { Icon } from '../ui/fields';

/** LinkedIn PDF'ini okuyup yeni CV oluşturur */
export async function cvFromLinkedIn(f: File): Promise<{ cv: CV; found: string[] }> {
  const { extractPdfText } = await import('../ats/pdfText');
  const { parseLinkedIn } = await import('../import/linkedin');
  return parseLinkedIn(await extractPdfText(new Uint8Array(await f.arrayBuffer())));
}

function useThumbs(ids: string[], enabled: boolean) {
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    (async () => {
      for (const id of ids) {
        if (thumbs[id]) continue;
        try {
          const r = await renderSvg(buildModel(sampleFor(id)), null);
          if (!alive) return;
          const p = r.pages[0];
          const svg = r.svg.replace(/<svg([^>]*?)viewBox="[^"]*"([^>]*?)width="[^"]*"([^>]*?)height="[^"]*"/, (_m, a, b, c) => `<svg${a}viewBox="0 0 ${p.width} ${p.height}"${b}width="100%"${c}height="100%"`);
          setThumbs((t) => ({ ...t, [id]: svg }));
        } catch {
          /* küçük resim olmadan da çalışır */
        }
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);
  return thumbs;
}

/** "CV'lerim" paneli: CV listesi ve yeni CV oluşturma yolları */
export function CvManager({ currentId, onClose, startTab = 'list' }: { currentId: string; onClose: () => void; startTab?: 'list' | 'new' | 'samples' | 'linkedin' }) {
  const [rows, setRows] = useState<CVRow[] | null>(null);
  const [tab, setTab] = useState(startTab);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const jsonRef = useRef<HTMLInputElement>(null);
  const liRef = useRef<HTMLInputElement>(null);
  const thumbs = useThumbs(
    PROFESSIONS.map((p) => p.id),
    tab === 'samples',
  );
  const refresh = () => listCVs().then(setRows);
  useEffect(() => {
    flushSave().then(refresh);
  }, []);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  const open = async (cv: CV, msg?: string) => {
    await saveCV(cv);
    onClose();
    navigate(`/duzenle/${cv.id}`);
    if (msg) toast(msg);
  };
  const duplicate = async (id: string) => {
    const cv = await getCV(id);
    if (!cv) return;
    await saveCV({ ...cv, id: uid(), name: `${cv.name} (kopya)`, createdAt: Date.now(), updatedAt: Date.now() });
    refresh();
  };
  const remove = async (id: string) => {
    await deleteCV(id);
    setConfirmId(null);
    const left = await listCVs();
    setRows(left);
    if (id === currentId) {
      onClose();
      navigate(left[0] ? `/duzenle/${left[0].id}` : '/', true);
    }
    toast('CV silindi.');
  };

  return (
    <div className="drawer-back" onClick={onClose}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="CV’lerim" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <h2>CV’lerim</h2>
          <button className="icon-btn" aria-label="Kapat" onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>
        <div className="tabs drawer-tabs" role="tablist">
          {(
            [
              ['list', 'Kayıtlı'],
              ['new', 'Yeni CV'],
              ['samples', 'Örnekler'],
            ] as const
          ).map(([k, l]) => (
            <button key={k} role="tab" aria-selected={tab === k || (k === 'new' && tab === 'linkedin')} className={tab === k || (k === 'new' && tab === 'linkedin') ? 'on' : ''} onClick={() => setTab(k)}>
              {l}
            </button>
          ))}
        </div>

        <div className="drawer-body">
          {tab === 'list' && (
            <>
              <p className="muted small">CV’lerin yalnızca bu tarayıcıda saklanır. Başka cihaza taşımak için menüden yedek indir.</p>
              <ul className="cv-list one-col">
                {(rows ?? []).map((c) => (
                  <li key={c.id} className={`cv-item${c.id === currentId ? ' current' : ''}`}>
                    <button className="cv-open" onClick={() => (c.id === currentId ? onClose() : (onClose(), navigate(`/duzenle/${c.id}`)))}>
                      <span className="cv-name">
                        {c.name}
                        {c.id === currentId && <span className="pill">Açık</span>}
                      </span>
                      <span className="cv-meta">
                        {[c.data.personal.firstName, c.data.personal.lastName].join(' ').trim() || 'Adsız'} · {c.data.lang.toUpperCase()} ·{' '}
                        {new Date(c.updatedAt).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </button>
                    <div className="cv-actions">
                      {confirmId === c.id ? (
                        <span className="confirm">
                          Silinsin mi?
                          <button className="btn danger sm" onClick={() => remove(c.id)}>
                            Sil
                          </button>
                          <button className="btn ghost sm" onClick={() => setConfirmId(null)}>
                            Vazgeç
                          </button>
                        </span>
                      ) : (
                        <>
                          <button className="icon-btn" aria-label={`${c.name} kopyasını oluştur`} title="Çoğalt" onClick={() => duplicate(c.id)}>
                            <Icon name="copy" />
                          </button>
                          <button className="icon-btn" aria-label={`${c.name} sil`} title="Sil" onClick={() => setConfirmId(c.id)}>
                            <Icon name="trash" />
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              <button className="btn primary full" onClick={() => setTab('new')}>
                <Icon name="plus" /> Yeni CV
              </button>
            </>
          )}

          {tab === 'new' && (
            <div className="new-options">
              <button className="new-opt" onClick={() => open(emptyCV(), 'Boş CV oluşturuldu.')}>
                <Icon name="file" size={20} />
                <span>
                  <strong>Boş CV</strong>
                  <small>Sıfırdan, adım adım doldur.</small>
                </span>
              </button>
              <button className="new-opt" onClick={() => setTab('samples')}>
                <Icon name="sparkle" size={20} />
                <span>
                  <strong>Örnekten başla</strong>
                  <small>12 meslek için hazır, düzenlenebilir örnekler.</small>
                </span>
              </button>
              <button className="new-opt" onClick={() => setTab('linkedin')}>
                <Icon name="linkedin" size={20} />
                <span>
                  <strong>LinkedIn profilinden</strong>
                  <small>LinkedIn PDF’ini seç, bilgiler otomatik yerleşsin.</small>
                </span>
              </button>
              <button className="new-opt" onClick={() => jsonRef.current?.click()}>
                <Icon name="upload" size={20} />
                <span>
                  <strong>Yedekten içe aktar</strong>
                  <small>Daha önce indirdiğin .json yedeği veya JSON Resume.</small>
                </span>
              </button>
              <input
                ref={jsonRef}
                type="file"
                accept="application/json,.json"
                hidden
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  try {
                    await open(importAny(await f.text()), 'Yedek içe aktarıldı.');
                  } catch (err) {
                    toast(err instanceof Error ? err.message : String(err), 'error');
                  }
                }}
              />
            </div>
          )}

          {tab === 'linkedin' && (
            <div className="li-help">
              <ol className="steps-list">
                <li>LinkedIn’de kendi profil sayfanı bilgisayardan aç.</li>
                <li>Profil fotoğrafının altındaki “Diğer” (More) düğmesine tıkla.</li>
                <li>“PDF olarak kaydet” (Save to PDF) seç; dosya bilgisayarına iner.</li>
                <li>Aşağıdan o dosyayı seç.</li>
              </ol>
              <p className="muted small">Dosya bilgisayarından çıkmaz, tarayıcında okunur. Otomatik yerleştirme her profilde kusursuz olmayabilir; sonucu kontrol et.</p>
              <button className="btn primary" disabled={busy} onClick={() => liRef.current?.click()}>
                <Icon name="upload" /> {busy ? 'Okunuyor…' : 'LinkedIn PDF’ini seç'}
              </button>
              <input
                ref={liRef}
                type="file"
                accept="application/pdf,.pdf"
                hidden
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setBusy(true);
                  try {
                    const { cv, found } = await cvFromLinkedIn(f);
                    await open(cv, `LinkedIn’den alındı: ${found.join(', ')}. Kontrol etmeyi unutma.`);
                  } catch (err) {
                    toast(err instanceof Error ? err.message : String(err), 'error');
                  } finally {
                    setBusy(false);
                  }
                }}
              />
            </div>
          )}

          {tab === 'samples' && (
            <>
              <p className="muted small">Bir örnek seç; kopyası açılır, kendi bilgilerinle değiştirirsin. Örnekteki kişiler kurgusaldır.</p>
              <ul className="sample-grid">
                {PROFESSIONS.map((p) => (
                  <li key={p.id}>
                    <button className="sample" onClick={() => open(sampleFor(p.id), `“${p.name}” örneği açıldı.`)}>
                      <div className="g-page">{thumbs[p.id] ? <div className="g-svg" dangerouslySetInnerHTML={{ __html: thumbs[p.id] }} /> : <div className="g-skel" />}</div>
                      <span className="sample-name">{p.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
