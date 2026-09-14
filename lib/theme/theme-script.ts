/**
 * Returns a small inline script (run in <head>, before hydration) that reads
 * the persisted theme preference and stamps `data-theme` on <html> so there
 * is no light->dark flash on load. Kept as a plain string (not JSX) because
 * it must run before React hydrates.
 */
export function getThemeInitScript(): string {
  return `
(function () {
  try {
    var raw = localStorage.getItem('iron-log:preferences');
    var theme = raw ? (JSON.parse(raw).theme || 'system') : 'system';
    if (theme === 'system') {
      var isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  } catch (e) {}
})();
`.trim()
}
