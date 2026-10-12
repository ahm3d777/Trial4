/**
 * Light/dark theme. The initial class is set by a tiny inline script in
 * each page's <head> (to avoid a flash); this module wires the toggles.
 */
const KEY = 'theme';

function safeGet() {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/** @param {'light'|'dark'} theme */
function safeSet(theme) {
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    /* private mode — the choice just won't persist */
  }
}

export function currentTheme() {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

/** @param {'light'|'dark'} theme */
export function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.style.colorScheme = theme;
  for (const btn of document.querySelectorAll('[data-theme-toggle]')) {
    btn.setAttribute('aria-pressed', String(theme === 'dark'));
    btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  }
}

export function initThemeToggle() {
  applyTheme(currentTheme());
  for (const btn of document.querySelectorAll('[data-theme-toggle]')) {
    btn.addEventListener('click', () => {
      const next = currentTheme() === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      safeSet(next);
    });
  }
  // Follow the OS setting until the user picks one explicitly.
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!safeGet()) applyTheme(e.matches ? 'dark' : 'light');
  });
}
