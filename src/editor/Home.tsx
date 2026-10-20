import { useEffect } from 'react';
import { listCVs, saveCV } from '../store/db';
import { sampleCV, sampleCVEn } from '../model/sample';
import { uiLang } from '../i18n';
import { navigate } from '../ui/app';

export const WELCOME_NAME = 'Örnek CV';
export const WELCOME_NAMES = new Set([WELCOME_NAME, 'Sample CV']);

let opening: Promise<void> | null = null;

/** Açılış: en son düzenlenen CV'yi aç; hiç yoksa örnek bir CV ile başla */
export function Home() {
  useEffect(() => {
    opening ??= (async () => {
      const rows = await listCVs();
      if (rows.length) return navigate(`/duzenle/${rows[0].id}`, true);
      const en = uiLang() === 'en';
      const cv = en ? sampleCVEn() : sampleCV();
      cv.name = en ? 'Sample CV' : WELCOME_NAME;
      await saveCV(cv);
      navigate(`/duzenle/${cv.id}`, true);
    })().finally(() => {
      opening = null;
    });
  }, []);
  return <div className="loading">Yükleniyor…</div>;
}
