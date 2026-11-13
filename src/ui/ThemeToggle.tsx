import { useState } from 'react';
import { Icon } from './fields';
import { applyTheme, readTheme, type Theme } from './theme';

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
