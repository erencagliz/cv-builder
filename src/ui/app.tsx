import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { Icon } from './fields';

/* ---------- yönlendirme (gerçek adresler; eski #/ bağlantıları da çalışır) ---------- */
const ROUTE_EVENT = 'app:navigate';
export function navigate(path: string, replace = false) {
  if (path === window.location.pathname) return;
  if (replace) window.history.replaceState(null, '', path);
  else window.history.pushState(null, '', path);
  window.dispatchEvent(new Event(ROUTE_EVENT));
  window.scrollTo(0, 0);
}
/** <a href> tıklamasını sayfa yenilemeden yönlendirmeye çevirir */
export function linkClick(e: React.MouseEvent<HTMLAnchorElement>) {
  const href = e.currentTarget.getAttribute('href');
  if (!href || !href.startsWith('/') || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
  e.preventDefault();
  navigate(href);
}
export function useRoute(): string {
  const get = () => {
    if (window.location.hash.startsWith('#/')) {
      const p = window.location.hash.slice(1);
      window.history.replaceState(null, '', p);
    }
    return window.location.pathname || '/';
  };
  const [route, setRoute] = useState(get);
  useEffect(() => {
    const on = () => setRoute(get());
    window.addEventListener('popstate', on);
    window.addEventListener(ROUTE_EVENT, on);
    return () => {
      window.removeEventListener('popstate', on);
      window.removeEventListener(ROUTE_EVENT, on);
    };
  }, []);
  return route;
}

/** Sayfa başlığı ve açıklaması (arama motorları ve paylaşım için) */
export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    document.title = title;
    if (description) {
      let m = document.querySelector('meta[name="description"]');
      if (!m) {
        m = document.createElement('meta');
        m.setAttribute('name', 'description');
        document.head.appendChild(m);
      }
      m.setAttribute('content', description);
    }
  }, [title, description]);
}

/* ---------- indirme ---------- */
export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/* ---------- bildirimler ---------- */
type ToastFn = (msg: string, kind?: 'info' | 'error') => void;
const ToastCtx = createContext<ToastFn>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<{ id: number; msg: string; kind: string }[]>([]);
  const push = useCallback<ToastFn>((msg, kind = 'info') => {
    const id = Date.now() + Math.random();
    setItems((x) => [...x.slice(-2), { id, msg, kind }]);
    setTimeout(() => setItems((x) => x.filter((t) => t.id !== id)), kind === 'error' ? 7000 : 3500);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`toast ${t.kind}`} role={t.kind === 'error' ? 'alert' : 'status'}>
            {t.kind === 'error' ? <Icon name="alert" /> : <Icon name="check" />} {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ---------- tema ---------- */
type Theme = 'light' | 'dark' | 'system';
const readTheme = (): Theme => {
  try {
    return (localStorage.getItem('theme') as Theme) || 'system';
  } catch {
    return 'system';
  }
};
export function applyTheme(t: Theme) {
  if (t === 'system') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', t);
}
export function ThemeToggle({ asMenuItem }: { asMenuItem?: boolean }) {
  const [theme, setTheme] = useState<Theme>(readTheme);
  const sysDark = typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  const isDark = theme === 'dark' || (theme === 'system' && sysDark);
  const toggle = () => {
    const next: Theme = isDark ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
    try {
      localStorage.setItem('theme', next);
    } catch {
      /* depolama kapalı olabilir */
    }
  };
  const label = isDark ? 'Aydınlık temaya geç' : 'Karanlık temaya geç';
  return asMenuItem ? (
    <button role="menuitem" onClick={toggle}>
      <Icon name={isDark ? 'sun' : 'moon'} /> {label}
    </button>
  ) : (
    <button className="icon-btn" aria-label={label} title={label} onClick={toggle}>
      <Icon name={isDark ? 'sun' : 'moon'} />
    </button>
  );
}
export const initTheme = () => applyTheme(readTheme());
