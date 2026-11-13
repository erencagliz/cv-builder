import { useEffect } from 'react';
import { listCVs, saveCV } from '../store/db';
import { sampleCV, sampleCVEn } from '../model/sample';
import { uiLang } from '../i18n';
import { go } from '../ui/router';

export const WELCOME_NAME = 'Örnek CV';
export const WELCOME_NAMES = new Set([WELCOME_NAME, 'Sample CV']);

let opening: Promise<void> | null = null;

export function Home() {
  useEffect(() => {
    opening ??= (async () => {
      const rows = await listCVs();
      if (rows.length) return go({ name: 'edit', id: rows[0].id }, true);
      const en = uiLang() === 'en';
      const cv = en ? sampleCVEn() : sampleCV();
      cv.name = en ? 'Sample CV' : WELCOME_NAME;
      await saveCV(cv);
      go({ name: 'edit', id: cv.id }, true);
    })().finally(() => {
      opening = null;
    });
  }, []);
  return <div className="loading">Yükleniyor…</div>;
}
