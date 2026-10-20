import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initTheme } from './ui/app';
import { initEngine } from './render/client';
import { installSelfHeal } from './ui/selfheal';
import { ErrorBoundary } from './ui/ErrorBoundary';
import { startDomTranslation, missingStrings } from './i18n';
import './styles/fonts.css';
import './styles/app.css';

initTheme();
installSelfHeal();
// Dizgi motorunu hemen yüklemeye başla (ilerleme önizlemede görünür)
initEngine().catch(() => {});

// Çevrimdışı çalışma (yalnızca yayın sürümünde)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}

startDomTranslation();
// sözlük bakımı için (yalnızca geliştirmede ve testlerde): window.__i18nMissing()
(window as unknown as { __i18nMissing: typeof missingStrings }).__i18nMissing = missingStrings;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
