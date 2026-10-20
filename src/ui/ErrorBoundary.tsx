import { Component, type ReactNode } from 'react';
import { isChunkError, reloadOnce } from './selfheal';
import { downloadBackup } from '../store/backup';

/** Beklenmedik bir arayüz hatasında beyaz ekran yerine kurtarma ekranı gösterir; veriler IndexedDB'de güvende kalır. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null; saved: boolean }> {
  state = { error: null as Error | null, saved: false };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error) {
    if (isChunkError(error)) reloadOnce('arayüz dosyası yüklenemedi');
  }
  render() {
    const { error, saved } = this.state;
    if (!error) return this.props.children;
    return (
      <div className="crash" role="alert">
        <div className="crash-card">
          <h1>Bir şeyler ters gitti</h1>
          <p>
            Endişelenme: CV’lerin bu tarayıcıda kayıtlı ve bu hatadan etkilenmedi. Sayfayı yenilemek çoğu zaman sorunu çözer. İstersen önce tüm CV’lerinin yedeğini indir.
          </p>
          <div className="crash-actions">
            <button className="btn primary" onClick={() => location.reload()}>
              Sayfayı yenile
            </button>
            <button
              className="btn ghost"
              onClick={async () => {
                try {
                  await downloadBackup();
                  this.setState({ saved: true });
                } catch {
                  /* yedek alınamadıysa da yenileme yolu açık */
                }
              }}
            >
              {saved ? 'Yedek indirildi' : 'Tüm CV’lerimi yedekle'}
            </button>
            <button className="btn ghost" onClick={() => (location.href = '/')}>
              Başa dön
            </button>
          </div>
          <details>
            <summary>Teknik ayrıntı</summary>
            <pre>{String(error.stack || error.message).slice(0, 1500)}</pre>
          </details>
        </div>
      </div>
    );
  }
}
