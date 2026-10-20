/**
 * Kendi kendini onarma: bakım gerektirmeden kullanıcıyı takılı bırakmayan küçük önlemler.
 *  - Yeni sürüm yayınlanınca eski sekmedeki tembel yüklenen dosyalar (chunk) bulunamaz → sayfayı bir kez yenile
 *  - Tarayıcıdan verilerin kalıcı saklanmasını iste (depolama dolduğunda silinmesin)
 *  - Arka plandaki yeni sürüm hazır olunca bir sonraki gezinmede kendiliğinden devreye girer (sw.js)
 */
const RELOAD_KEY = 'heal-reload-at';

export function reloadOnce(reason: string): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
    if (Date.now() - last < 30_000) return false; // döngüye girme
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    /* sessionStorage yoksa da bir kez dene */
  }
  console.warn('Kendini onarma: sayfa yenileniyor —', reason);
  location.reload();
  return true;
}

export const isChunkError = (e: unknown) =>
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|ChunkLoadError|Unable to preload CSS/i.test(
    e instanceof Error ? `${e.name} ${e.message}` : String(e),
  );

export function installSelfHeal() {
  window.addEventListener('vite:preloadError', (ev) => {
    ev.preventDefault();
    reloadOnce('yeni sürüm dosyası yüklenemedi');
  });
  window.addEventListener('unhandledrejection', (ev) => {
    if (isChunkError(ev.reason)) {
      ev.preventDefault();
      reloadOnce('dinamik modül yüklenemedi');
    }
  });
}

let asked = false;
/** İlk kayıttan sonra kalıcı depolama iste; tarayıcı izin vermezse sessizce geç. */
export function requestPersistence() {
  if (asked) return;
  asked = true;
  try {
    navigator.storage?.persisted?.().then((p) => (p ? undefined : navigator.storage.persist?.())).catch(() => {});
  } catch {
    /* desteklenmiyor */
  }
}
