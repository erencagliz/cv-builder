const RELOAD_KEY = 'heal-reload-at';

export function reloadOnce(reason: string): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
    if (Date.now() - last < 30_000) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
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
export function requestPersistence() {
  if (asked) return;
  asked = true;
  try {
    navigator.storage?.persisted?.().then((p) => (p ? undefined : navigator.storage.persist?.())).catch(() => {});
  } catch {
  }
}
