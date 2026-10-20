import { useState } from 'react';
import { CONTACT_EMAIL } from '../config';
import { wipeAll, listCVs } from '../store/db';
import { exportNative } from '../model/io';
import { downloadBlob, useToast } from '../ui/app';
import { Icon } from '../ui/fields';

export function PrivacyModal({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const [confirm, setConfirm] = useState(false);
  const exportAll = async () => {
    const rows = await listCVs();
    const data = rows.map((r) => JSON.parse(exportNative(r.data)));
    downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), 'tum-cvlerim.json');
  };
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal prose-modal" role="dialog" aria-modal="true" aria-label="Gizlilik ve verilerim" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Gizlilik ve verilerin</h2>
          <button className="icon-btn" aria-label="Kapat" onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>
        <p className="lede-sm">Kısaca: CV’ne yazdığın bilgiler cihazından çıkmaz. Sunucu, veritabanı veya çerez yok.</p>
        <h3>Hangi veriler, nerede tutuluyor?</h3>
        <p>
          Girdiğin ad, iletişim bilgileri, deneyim, eğitim, fotoğraf ve diğer tüm CV içerikleri yalnızca kullandığın tarayıcının yerel depolama alanında (IndexedDB) saklanır. PDF dosyası da
          bilgisayarında, tarayıcının içinde oluşturulur. Bu veriler bize veya üçüncü kişilere gönderilmez.
        </p>
        <p>Uygulamanın çalışması için indirilen dosyalar (program kodu, yazı tipleri, PDF dizgi motoru) yalnızca bu sitenin kendi sunucusundan gelir; Google Fonts gibi dış servisler kullanılmaz.</p>

        <h3>Çerezler ve analiz</h3>
        <p>Çerez kullanılmaz. Reklam, takip veya profil çıkarma amaçlı hiçbir araç yoktur. Yalnızca tema tercihin (aydınlık/karanlık) tarayıcında saklanır.</p>

        <h3>6698 sayılı KVKK kapsamındaki haklar</h3>
        <p>
          Veriler bizim tarafımızdan işlenmediği ve aktarılmadığı için kontrol tamamen sendedir. Verilerini istediğin an indirebilir veya silebilirsin. Tarayıcı verilerini temizlediğinde ya da
          gizli pencerede çalıştığında CV’lerin silinir; bu yüzden düzenli olarak yedek indirmeni öneririz.
        </p>
        {CONTACT_EMAIL && (
          <p>
            Sorular için: <span className="selectable">{CONTACT_EMAIL}</span>
          </p>
        )}

        <h3>Verilerini yönet</h3>
        <div className="row-actions">
          <button className="btn ghost" onClick={exportAll}>
            Tüm CV’lerimi indir (.json)
          </button>
          {confirm ? (
            <>
              <span>Tüm CV’ler ve sürüm geçmişi silinecek. Emin misin?</span>
              <button
                className="btn danger"
                onClick={async () => {
                  await wipeAll();
                  setConfirm(false);
                  toast('Tüm veriler silindi.');
                  setTimeout(() => window.location.reload(), 600);
                }}
              >
                Evet, hepsini sil
              </button>
              <button className="btn ghost" onClick={() => setConfirm(false)}>
                Vazgeç
              </button>
            </>
          ) : (
            <button className="btn danger-ghost" onClick={() => setConfirm(true)}>
              Tüm verilerimi sil
            </button>
          )}
        </div>
        <p className="muted small">Bu metin bilgilendirme amaçlıdır; siteyi yayınlayan kişi veya kurum kendi durumuna göre bir hukukçuya gözden geçirtmelidir.</p>
      </div>
    </div>
  );
}
