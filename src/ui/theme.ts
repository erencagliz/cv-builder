export type Theme = 'light' | 'dark' | 'system';
export const readTheme = (): Theme => {
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
export const initTheme = () => applyTheme(readTheme());
