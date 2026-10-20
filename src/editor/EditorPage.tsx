import { useEffect, useRef, useState } from 'react';
import type { CV } from '../model/types';
import { useEditor, flushSave } from '../store/editor';
import { getCV, saveCV, listSnapshots, type SnapshotRow } from '../store/db';
import { buildModel, fileName } from '../render/buildModel';
import { renderPdf, dataUrlToBytes } from '../render/client';
import { toPlainText } from '../render/plainText';
import { exportNative, toJsonResume, importAny } from '../model/io';
import { uid } from '../model/defaults';
import { ContentPanel } from './ContentPanel';
import { DesignPanel } from './DesignPanel';
import { Wizard } from './Wizard';
import { CvManager } from './CvManager';
import { PrivacyModal } from './PrivacyModal';
import { WELCOME_NAME } from './Home';
import { emptyCV } from '../model/defaults';
import { LetterPanel } from './LetterPanel';
import { AtsView, JobMatchView } from './Insights';
import { fitToOnePage } from './fit';
import { buildLetterModel } from '../render/buildModel';
import { countPages } from '../render/client';
import { Preview } from './Preview';
import { Icon } from '../ui/fields';
import { downloadBlob, navigate, useToast, ThemeToggle } from '../ui/app';
import { APP_NAME } from '../config';

export function EditorPage({ id }: { id: string }) {
  const { cv, load } = useEditor();
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let alive = true;
    getCV(id).then((doc) => {
      if (!alive) return;
      if (doc) load(doc);
      else setMissing(true);
    });
    return () => {
      alive = false;
      flushSave();
    };
  }, [id, load]);

  useEffect(() => {
    if (cv) document.title = `${cv.name} · ${APP_NAME}`;
  }, [cv?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  if (missing)
    return (
      <div className="empty-state">
        <h1>Bu CV bulunamadı</h1>
        <p>CV’ler yalnızca bu tarayıcıda saklanır. Başka bir cihazda oluşturduysan oradan JSON olarak dışa aktarıp burada içe aktarabilirsin.</p>
        <button className="btn primary" onClick={() => navigate('/', true)}>
          Son CV’ni aç
        </button>
      </div>
    );
  if (!cv || cv.id !== id) return <div className="loading">Yükleniyor…</div>;
  return <Editor cv={cv} />;
}

function Editor({ cv }: { cv: CV }) {
  const { update, undo, redo, past, future, saveState, replace } = useEditor();
  const [tab, setTab] = useState<'wizard' | 'content' | 'design' | 'letter'>('wizard');
  const [view, setView] = useState<'preview' | 'ats' | 'job'>('preview');
  const [fitting, setFitting] = useState(false);
  const [manager, setManager] = useState<null | 'list' | 'new' | 'samples' | 'linkedin'>(null);
  const [privacy, setPrivacy] = useState(false);
  const [welcome, setWelcome] = useState(() => {
    try {
      return cv.name === WELCOME_NAME && localStorage.getItem('welcomed') !== '1';
    } catch {
      return cv.name === WELCOME_NAME;
    }
  });
  const dismissWelcome = () => {
    setWelcome(false);
    try {
      localStorage.setItem('welcomed', '1');
    } catch {
      /* depolama kapalı olabilir */
    }
  };
  const liInput = useRef<HTMLInputElement>(null);
  const [mobileView, setMobileView] = useState<'edit' | 'preview'>('edit');
  const [exporting, setExporting] = useState(false);
  const [menu, setMenu] = useState(false);
  const [history, setHistory] = useState<SnapshotRow[] | null>(null);
  const [status, setStatus] = useState({ pages: 0, error: '' });
  const toast = useToast();
  const fileInput = useRef<HTMLInputElement>(null);

  const downloadLetterPdf = async () => {
    setExporting(true);
    try {
      const res = await renderPdf(buildLetterModel(cv), dataUrlToBytes(cv.personal.photo));
      if (!res.pdf) throw new Error(res.diagnostics[0] ?? 'PDF oluşturulamadı.');
      downloadBlob(new Blob([res.pdf as BlobPart], { type: 'application/pdf' }), fileName(cv, 'pdf').replace(/-(CV|Resume)\.pdf$/, cv.lang === 'tr' ? '-On-Yazi.pdf' : '-Cover-Letter.pdf'));
      toast('Ön yazı indirildi.');
    } catch (e) {
      toast(`Ön yazı oluşturulamadı: ${e instanceof Error ? e.message : e}`, 'error');
    } finally {
      setExporting(false);
    }
  };
  const downloadDocx = async (letter = false) => {
    setMenu(false);
    setExporting(true);
    try {
      const { buildDocx } = await import('../export/docx');
      const blob = await buildDocx(letter ? buildLetterModel(cv) : buildModel(cv));
      const name = fileName(cv, 'docx');
      downloadBlob(blob, letter ? name.replace(/-(CV|Resume)\.docx$/, cv.lang === 'tr' ? '-On-Yazi.docx' : '-Cover-Letter.docx') : name);
      toast('Word dosyası indirildi.');
    } catch (e) {
      toast(`Word dosyası oluşturulamadı: ${e instanceof Error ? e.message : e}`, 'error');
    } finally {
      setExporting(false);
    }
  };
  const fitOnePage = async () => {
    setFitting(true);
    try {
      const photo = dataUrlToBytes(cv.personal.photo);
      const r = await fitToOnePage(cv, (c) => countPages(buildModel(c), photo ? photo.slice() : null));
      if (!r) toast('Okunabilir boyutlarda tek sayfaya sığmıyor. Eski işleri kısaltmayı ya da az önemli bölümleri gizlemeyi dene.', 'error');
      else if (r.factor < 1) {
        update((d) => void (d.design = r.design));
        toast(`Tek sayfaya sığdırıldı (yazılar %${Math.round((1 - r.factor) * 100)} küçüldü). Geri almak için Ctrl+Z.`);
      }
    } catch (e) {
      toast(String(e), 'error');
    } finally {
      setFitting(false);
    }
  };
  const importLinkedIn = async (f: File) => {
    try {
      const { extractPdfText } = await import('../ats/pdfText');
      const { parseLinkedIn } = await import('../import/linkedin');
      const { cv: li, found } = parseLinkedIn(await extractPdfText(new Uint8Array(await f.arrayBuffer())));
      replace({ ...li, id: cv.id, name: cv.name, createdAt: cv.createdAt, design: cv.design, sectionIcons: cv.sectionIcons });
      toast(`LinkedIn’den alındı: ${found.join(', ')}. Kontrol etmeyi unutma; Ctrl+Z ile geri alabilirsin.`);
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), 'error');
    }
  };

  const downloadPdf = async () => {
    setExporting(true);
    try {
      await flushSave();
      const res = await renderPdf(buildModel(cv), dataUrlToBytes(cv.personal.photo));
      if (!res.pdf) throw new Error(res.diagnostics[0] ?? 'PDF oluşturulamadı.');
      downloadBlob(new Blob([res.pdf as BlobPart], { type: 'application/pdf' }), fileName(cv, 'pdf'));
      toast('PDF indirildi.');
    } catch (e) {
      toast(`PDF oluşturulamadı: ${e instanceof Error ? e.message : e}`, 'error');
    } finally {
      setExporting(false);
    }
  };

  // Klavye kısayolları
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      const k = e.key.toLowerCase();
      // Alanlar React tarafından yönetildiği için geri al her yerde uygulama geçmişini kullanır
      if (k === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((k === 'z' && e.shiftKey) || k === 'y') {
        e.preventDefault();
        redo();
      } else if (k === 's') {
        e.preventDefault();
        flushSave().then(() => toast('Kaydedildi.'));
      } else if (k === 'p') {
        e.preventDefault();
        downloadPdf();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  useEffect(() => {
    const onUnload = () => void flushSave();
    window.addEventListener('pagehide', onUnload);
    return () => window.removeEventListener('pagehide', onUnload);
  }, []);

  const exportJson = () => {
    downloadBlob(new Blob([exportNative(cv)], { type: 'application/json' }), fileName(cv, 'json'));
    setMenu(false);
  };
  const exportJsonResume = () => {
    downloadBlob(new Blob([JSON.stringify(toJsonResume(cv), null, 2)], { type: 'application/json' }), fileName(cv, 'resume.json'));
    setMenu(false);
  };
  const exportTxt = () => {
    downloadBlob(new Blob([toPlainText(buildModel(cv))], { type: 'text/plain;charset=utf-8' }), fileName(cv, 'txt'));
    setMenu(false);
  };
  const copyTxt = async () => {
    setMenu(false);
    try {
      await navigator.clipboard.writeText(toPlainText(buildModel(cv)));
      toast('CV metni panoya kopyalandı.');
    } catch {
      toast('Kopyalanamadı; “Düz metin indir” seçeneğini kullan.', 'error');
    }
  };
  const duplicate = async () => {
    setMenu(false);
    await flushSave();
    const copy: CV = { ...structuredClone(cv), id: uid(), name: `${cv.name} (kopya)`, createdAt: Date.now(), updatedAt: Date.now() };
    await saveCV(copy);
    navigate(`/duzenle/${copy.id}`);
    toast('Kopya oluşturuldu. Artık kopyayı düzenliyorsun.');
  };
  const importFile = async (f: File) => {
    try {
      const imported = importAny(await f.text());
      replace({ ...imported, id: cv.id, name: cv.name, createdAt: cv.createdAt });
      toast('İçe aktarıldı. Geri almak için Ctrl+Z.');
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), 'error');
    }
  };
  const openHistory = async () => {
    setMenu(false);
    setHistory(await listSnapshots(cv.id));
  };

  return (
    <div className={`editor mobile-${mobileView}`}>
      <header className="topbar">
        <button className="btn ghost cvs-btn" onClick={() => setManager('list')} title="CV’lerim, yeni CV, örnekler">
          <Icon name="files" /> <span className="hide-sm">CV’lerim</span>
        </button>
        <input className="doc-name" aria-label="CV adı (yalnızca senin için)" value={cv.name} onChange={(e) => update((d) => void (d.name = e.target.value), 'name')} />
        <span className={`save-state ${saveState}`} aria-live="polite">
          {saveState === 'saving' ? 'Kaydediliyor…' : saveState === 'error' ? 'Kaydedilemedi' : 'Kaydedildi'}
        </span>
        <div className="topbar-group">
          <button className="icon-btn" aria-label="Geri al" title="Geri al (Ctrl+Z)" disabled={!past.length} onClick={undo}>
            <Icon name="undo" />
          </button>
          <button className="icon-btn" aria-label="Yinele" title="Yinele (Ctrl+Y)" disabled={!future.length} onClick={redo}>
            <Icon name="redo" />
          </button>
        </div>
        <span className="privacy-badge hide-sm" title="Hiçbir bilgi sunucuya gönderilmez">
          <Icon name="shield" size={14} /> Verilerin bu tarayıcıda kalır
        </span>
        <div className="spacer" />
        <div className="segmented lang" role="radiogroup" aria-label="CV dili">
          {(['tr', 'en'] as const).map((l) => (
            <button key={l} role="radio" aria-checked={cv.lang === l} className={cv.lang === l ? 'on' : ''} onClick={() => update((d) => void (d.lang = l))} title={l === 'tr' ? 'Başlıklar ve tarihler Türkçe' : 'Başlıklar ve tarihler İngilizce'}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
        <button
          className={`btn ghost intl${cv.international ? ' on' : ''}`}
          aria-pressed={cv.international}
          title="Fotoğraf, doğum tarihi, medeni durum ve askerliği gizler"
          onClick={() => {
            const on = !cv.international;
            update((d) => {
              d.international = on;
              if (on) d.lang = 'en';
            });
            toast(on ? 'Uluslararası mod açık: CV İngilizce, kişisel bilgiler sadeleşti.' : 'Uluslararası mod kapandı.');
          }}
        >
          <Icon name="globe" /> <span className="hide-sm">Uluslararası</span>
        </button>
        <div className="menu-wrap">
          <button className="icon-btn" aria-label="Diğer işlemler" aria-expanded={menu} onClick={() => setMenu(!menu)}>
            <Icon name="more" />
          </button>
          {menu && (
            <>
              <div className="menu-backdrop" onClick={() => setMenu(false)} />
              <div className="menu" role="menu">
                <button role="menuitem" onClick={copyTxt}>
                  <Icon name="copy" /> CV metnini kopyala
                </button>
                <button role="menuitem" onClick={() => downloadDocx(false)}>
                  <Icon name="file" /> Word olarak indir (.docx)
                </button>
                <button role="menuitem" onClick={exportTxt}>
                  <Icon name="file" /> Düz metin indir (.txt)
                </button>
                <button role="menuitem" onClick={exportJson}>
                  <Icon name="download" /> Yedek indir (.json)
                </button>
                <button role="menuitem" onClick={exportJsonResume}>
                  <Icon name="download" /> JSON Resume olarak indir
                </button>
                <button
                  role="menuitem"
                  onClick={() => {
                    setMenu(false);
                    fileInput.current?.click();
                  }}
                >
                  <Icon name="upload" /> Bu CV’nin üzerine içe aktar
                </button>
                <button
                  role="menuitem"
                  onClick={() => {
                    setMenu(false);
                    liInput.current?.click();
                  }}
                >
                  <Icon name="linkedin" /> LinkedIn PDF’inden doldur
                </button>
                <hr />
                <button role="menuitem" onClick={duplicate}>
                  <Icon name="copy" /> CV’yi çoğalt
                </button>
                <button role="menuitem" onClick={openHistory}>
                  <Icon name="history" /> Sürüm geçmişi
                </button>
                <hr />
                <button
                  role="menuitem"
                  onClick={() => {
                    setMenu(false);
                    setPrivacy(true);
                  }}
                >
                  <Icon name="shield" /> Gizlilik ve verilerim
                </button>
                <ThemeToggle asMenuItem />
              </div>
            </>
          )}
          <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && importFile(e.target.files[0])} />
          <input ref={liInput} type="file" accept="application/pdf,.pdf" hidden onChange={(e) => e.target.files?.[0] && importLinkedIn(e.target.files[0])} />
        </div>
        <button className="btn primary" onClick={downloadPdf} disabled={exporting || !!status.error}>
          <Icon name="download" /> {exporting ? 'Hazırlanıyor…' : 'PDF indir'}
        </button>
      </header>

      <div className="workspace">
        <aside className="panel" aria-label="Düzenleme">
          <div className="tabs" role="tablist">
            <button role="tab" aria-selected={tab === 'wizard'} className={tab === 'wizard' ? 'on' : ''} onClick={() => setTab('wizard')}>
              Adım adım
            </button>
            <button role="tab" aria-selected={tab === 'content'} className={tab === 'content' ? 'on' : ''} onClick={() => setTab('content')}>
              Tüm bölümler
            </button>
            <button role="tab" aria-selected={tab === 'design'} className={tab === 'design' ? 'on' : ''} onClick={() => setTab('design')}>
              Tasarım
            </button>
            <button role="tab" aria-selected={tab === 'letter'} className={tab === 'letter' ? 'on' : ''} onClick={() => setTab('letter')}>
              Ön yazı
            </button>
          </div>
          <div className="panel-scroll" lang={cv.lang}>
            {welcome && (
              <div className="welcome" role="note">
                <div>
                  <strong>Hoş geldin!</strong> Örnek bir CV ile başladın. Bilgileri kendi bilgilerinle değiştir; sağdaki önizleme anında güncellenir.
                </div>
                <div className="welcome-actions">
                  <button
                    className="btn primary sm"
                    onClick={() => {
                      replace({ ...emptyCV('CV’m'), id: cv.id, createdAt: cv.createdAt });
                      dismissWelcome();
                      toast('Boş CV ile başladın. Geri almak için Ctrl+Z.');
                    }}
                  >
                    Boş başla
                  </button>
                  <button className="btn ghost sm" onClick={() => setManager('linkedin')}>
                    <Icon name="linkedin" /> LinkedIn’den doldur
                  </button>
                  <button className="btn ghost sm" onClick={() => setManager('samples')}>
                    Başka örnek seç
                  </button>
                </div>
                <button className="icon-btn sm welcome-x" aria-label="Kapat" onClick={dismissWelcome}>
                  <Icon name="x" />
                </button>
              </div>
            )}
            {tab === 'wizard' ? (
              <Wizard cv={cv} onDownload={downloadPdf} />
            ) : tab === 'content' ? (
              <ContentPanel cv={cv} />
            ) : tab === 'design' ? (
              <DesignPanel cv={cv} />
            ) : (
              <LetterPanel cv={cv} onPdf={downloadLetterPdf} onDocx={() => downloadDocx(true)} busy={exporting} />
            )}
          </div>
        </aside>
        <main className="preview-area" aria-label="Önizleme">
          {tab !== 'letter' && (
            <div className="view-tabs" role="tablist" aria-label="Görünüm">
              {(
                [
                  ['preview', 'Önizleme'],
                  ['ats', 'ATS kontrolü'],
                  ['job', 'İlana uygunluk'],
                ] as const
              ).map(([k, label]) => (
                <button key={k} role="tab" aria-selected={view === k} className={view === k ? 'on' : ''} onClick={() => setView(k)}>
                  {label}
                </button>
              ))}
            </div>
          )}
          {tab === 'letter' || view === 'preview' ? (
            <Preview cv={cv} onStatus={setStatus} letter={tab === 'letter'} onFit={fitOnePage} fitting={fitting} />
          ) : view === 'ats' ? (
            <AtsView cv={cv} />
          ) : (
            <JobMatchView cv={cv} />
          )}
        </main>
      </div>

      <nav className="mobile-tabs" aria-label="Görünüm">
        <button className={mobileView === 'edit' ? 'on' : ''} onClick={() => setMobileView('edit')}>
          Düzenle
        </button>
        <button className={mobileView === 'preview' ? 'on' : ''} onClick={() => setMobileView('preview')}>
          Önizle {status.pages ? `· ${status.pages} sayfa` : ''}
        </button>
      </nav>

      {manager && <CvManager currentId={cv.id} startTab={manager} onClose={() => setManager(null)} />}
      {privacy && <PrivacyModal onClose={() => setPrivacy(false)} />}
      {history && (
        <div className="modal-back" onClick={() => setHistory(null)}>
          <div className="modal" role="dialog" aria-modal="true" aria-label="Sürüm geçmişi" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Sürüm geçmişi</h2>
              <button className="icon-btn" aria-label="Kapat" onClick={() => setHistory(null)}>
                <Icon name="x" />
              </button>
            </div>
            <p className="muted">Düzenlerken en fazla 10 dakikada bir otomatik kayıt alınır; son 30 sürüm saklanır.</p>
            {history.length === 0 ? (
              <p>Henüz kayıtlı bir sürüm yok.</p>
            ) : (
              <ul className="history">
                {history.map((h) => (
                  <li key={h.id}>
                    <span>{new Date(h.at).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    <span className="muted">
                      {[h.data.personal.firstName, h.data.personal.lastName].join(' ').trim() || 'Adsız'} · {h.data.sections.experience.length} deneyim
                    </span>
                    <button
                      className="btn ghost sm"
                      onClick={() => {
                        replace({ ...h.data, id: cv.id });
                        setHistory(null);
                        toast('Sürüm geri yüklendi. Vazgeçmek için Ctrl+Z.');
                      }}
                    >
                      Geri yükle
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
