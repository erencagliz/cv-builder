import { useEffect, useState } from 'react';
import type { CV } from '../model/types';
import { decodeCV } from './link';
import { Preview } from '../editor/Preview';
import { buildModel, fileName } from '../render/buildModel';
import { renderPdf, dataUrlToBytes } from '../render/client';
import { saveCV } from '../store/db';
import { uid } from '../model/defaults';
import { Icon } from '../ui/fields';
import { downloadBlob } from '../ui/download';
import { go, usePageMeta } from '../ui/router';
import { useToast } from '../ui/toast';
import { APP_NAME } from '../config';

export function Viewer() {
  const [cv, setCv] = useState<CV | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const name = cv ? [cv.personal.firstName, cv.personal.lastName].join(' ').trim() : '';
  usePageMeta(name ? `${name} – CV` : `Paylaşılan CV – ${APP_NAME}`);
  useEffect(() => {
    const load = () => {
      if (!location.hash || location.hash.length < 4) {
        setError('Bu bağlantıda CV yok. Bağlantının tamamını kopyaladığından emin ol.');
        return;
      }
      decodeCV(location.hash)
        .then((c) => {
          setCv(c);
          setError('');
        })
        .catch((e) => setError(e instanceof Error ? e.message : String(e)));
    };
    load();
    window.addEventListener('hashchange', load);
    return () => window.removeEventListener('hashchange', load);
  }, []);

  const pdf = async () => {
    if (!cv) return;
    setBusy(true);
    try {
      const res = await renderPdf(buildModel(cv), dataUrlToBytes(cv.personal.photo));
      if (!res.pdf) throw new Error(res.diagnostics[0] ?? 'PDF oluşturulamadı');
      downloadBlob(new Blob([res.pdf as BlobPart], { type: 'application/pdf' }), fileName(cv, 'pdf'));
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), 'error');
    } finally {
      setBusy(false);
    }
  };
  const copy = async () => {
    if (!cv) return;
    const mine = { ...cv, id: uid(), name: name ? `${name} (paylaşılan)` : 'Paylaşılan CV', createdAt: Date.now(), updatedAt: Date.now() };
    await saveCV(mine);
    go({ name: 'edit', id: mine.id });
    toast('CV’lerine kopyalandı; artık düzenleyebilirsin.');
  };

  return (
    <div className="viewer">
      <header className="topbar viewer-bar">
        <button className="btn ghost" onClick={() => go({ name: 'home' })} title={`${APP_NAME} ile kendi CV’ni hazırla`}>
          <Icon name="files" /> <span className="hide-sm">{APP_NAME}</span>
        </button>
        <strong className="viewer-name">{name ? `${name} – CV` : 'Paylaşılan CV'}</strong>
        <span className="spacer" />
        {cv && (
          <>
            <button className="btn ghost" onClick={copy}>
              <Icon name="copy" /> <span className="hide-sm">CV’lerime kopyala</span>
            </button>
            <button className="btn primary" onClick={pdf} disabled={busy}>
              <Icon name="download" /> {busy ? 'Hazırlanıyor…' : 'PDF indir'}
            </button>
          </>
        )}
      </header>
      {error ? (
        <div className="empty-state">
          <h1>CV açılamadı</h1>
          <p>{error}</p>
          <button className="btn primary" onClick={() => go({ name: 'home' })}>
            Kendi CV’ni hazırla
          </button>
        </div>
      ) : cv ? (
        <main className="viewer-main">
          <Preview cv={cv} />
        </main>
      ) : (
        <div className="loading">Açılıyor…</div>
      )}
    </div>
  );
}
