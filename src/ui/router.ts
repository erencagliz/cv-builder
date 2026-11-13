import { useEffect, useState } from 'react';
import { buildPath, parsePath, type Route } from '../routes';
import { uiLang } from '../i18n';

const ROUTE_EVENT = 'app:navigate';
export function navigate(path: string, replace = false) {
  if (path === window.location.pathname) return;
  if (replace) window.history.replaceState(null, '', path);
  else window.history.pushState(null, '', path);
  window.dispatchEvent(new Event(ROUTE_EVENT));
  window.scrollTo(0, 0);
}
export const pathFor = (route: Omit<Route, 'lang'>) => buildPath({ ...route, lang: uiLang() });
export const go = (route: Omit<Route, 'lang'>, replace = false) => navigate(pathFor(route), replace);

export function useRoute(): Route {
  const get = (): Route => {
    if (window.location.hash.startsWith('#/')) window.history.replaceState(null, '', window.location.hash.slice(1));
    const route = parsePath(window.location.pathname);
    const canonical = buildPath(route, uiLang());
    if (canonical !== window.location.pathname) window.history.replaceState(null, '', canonical + window.location.search + window.location.hash);
    return { ...route, lang: uiLang() };
  };
  const [route, setRoute] = useState<Route>(get);
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
