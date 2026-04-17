export type ThemeMode = 'dark' | 'light';

const THEME_STORAGE_KEY = 'inventory_theme_mode';

export function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') {
    return stored;
  }

  if (window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }

  return 'dark';
}

export function applyTheme(theme: ThemeMode): void {
  if (typeof document === 'undefined') {
    return;
  }

  document.body.classList.remove('theme-light', 'theme-dark');
  document.body.classList.add(theme === 'light' ? 'theme-light' : 'theme-dark');
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}
