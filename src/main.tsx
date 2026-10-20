import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initTheme } from './ui/app';
import { initEngine } from './render/client';
import './styles/fonts.css';
import './styles/app.css';

initTheme();
// Dizgi motorunu arka planda önceden yükle
if ('requestIdleCallback' in window) requestIdleCallback(() => initEngine().catch(() => {}));
else setTimeout(() => initEngine().catch(() => {}), 1500);

// Çevrimdışı çalışma (yalnızca yayın sürümünde)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
