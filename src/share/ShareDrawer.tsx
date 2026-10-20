import { useEffect, useState } from 'react';
import { uiLocale } from '../i18n';
import qrcode from 'qrcode-generator';
import type { CV } from '../model/types';
import { encodeCV, shareUrl } from './link';
import { Icon, Checkbox } from '../ui/fields';
import { useToast } from '../ui/app';

/** QR kodu SVG olarak çizer; veri sığmazsa null */
export function qrSvg(text: string): string | null {
  try {
    const q = qrcode(0, 'L');
    q.addData(text, 'Byte');
    q.make();
    return q.createSvgTag({ cellSize: 4, margin: 4, scalable: true });
  } catch {
    return null;
  }
}

export function ShareDrawer({ cv, onClose }: { cv: CV; onClose: () => void }) {
  const [photo, setPhoto] = useState(false);
  const [url, setUrl] = useState('');
  const [qr, setQr] = useState(false);
  const toast = useToast();
  const hasPhoto = !!cv.personal.photo && cv.personal.showPhoto;
  useEffect(() => {
    let alive = true;
    encodeCV(cv, { photo: photo && hasPhoto }).then((code) => alive && setUrl(shareUrl(code)));
    return () => {
      alive = false;
    };
  }, [cv, photo, hasPhoto]);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);
  const svg = qr && url ? qrSvg(url) : null;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast('Bağlantı kopyalandı.');
    } catch {
      toast('Kopyalanamadı; bağlantıyı seçip elle kopyala.', 'error');
    }
  };
  const canShare = typeof navigator.share === 'function';

  return (
    <div className="drawer-back" onClick={onClose}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Paylaş ve taşı" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <h2>Paylaş ve taşı</h2>
          <button className="icon-btn" aria-label="Kapat" onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>
        <div className="drawer-body share">
          <p className="muted small">
            CV’n bağlantının kendisine sıkıştırılarak yazılır; hiçbir sunucuya yüklenmez. Bağlantıyı açan kişi CV’ni görür, PDF indirebilir ya da kendi tarayıcısına kopyalayabilir. Aynı yolla
            CV’ni telefonuna veya başka bir bilgisayara taşıyabilirsin.
          </p>
          {hasPhoto && <Checkbox label="Fotoğrafı da ekle (bağlantı çok uzar, QR kod kullanılamaz)" checked={photo} onChange={setPhoto} />}
          <label className="field">
            <span className="field-label">Bağlantı</span>
            <textarea className="input share-url" readOnly rows={3} value={url} onFocus={(e) => e.currentTarget.select()} aria-label="Paylaşım bağlantısı" />
            <span className="field-hint">{url ? `${url.length.toLocaleString(uiLocale())} karakter` : 'Hazırlanıyor…'}</span>
          </label>
          <div className="share-actions">
            <button className="btn primary" disabled={!url} onClick={copy}>
              <Icon name="copy" /> Bağlantıyı kopyala
            </button>
            {canShare && (
              <button
                className="btn ghost"
                disabled={!url}
                onClick={() => navigator.share({ title: `${[cv.personal.firstName, cv.personal.lastName].join(' ').trim() || 'CV'} – CV`, url }).catch(() => {})}
              >
                <Icon name="share" /> Paylaş…
              </button>
            )}
            <button className="btn ghost" disabled={!url} onClick={() => setQr(!qr)} aria-expanded={qr}>
              <Icon name="qr" /> {qr ? 'QR kodu gizle' : 'Telefona QR ile aktar'}
            </button>
            {url && (
              <a className="btn ghost" href={url} target="_blank" rel="noopener noreferrer">
                <Icon name="eye" /> Önizle
              </a>
            )}
          </div>
          {qr && (
            <div className="qr-box">
              {svg ? (
                <>
                  <div className="qr" dangerouslySetInnerHTML={{ __html: svg }} />
                  <p className="muted small">Telefonunun kamerasıyla okut; açılan sayfada “CV’lerime kopyala”ya bas. Okumazsa ekranı yakınlaştır.</p>
                </>
              ) : (
                <p className="note warn">
                  <Icon name="alert" size={14} /> Bu CV QR koduna sığmayacak kadar uzun. Bağlantıyı kendine e-posta ya da mesajla gönder.
                </p>
              )}
            </div>
          )}
          <p className="note info">
            <Icon name="info" size={14} /> Bağlantıyı gönderdiğin herkes CV’ni görebilir. Sonradan yaptığın değişiklikler eski bağlantıya yansımaz; yeni bağlantı oluştur.
          </p>
        </div>
      </aside>
    </div>
  );
}
