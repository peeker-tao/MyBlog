(function () {
  const storageKey = 'blog-theme';
  const toggle = document.getElementById('theme-toggle');
  const root = document.documentElement;

  function getPreferredTheme() {
    const saved = localStorage.getItem(storageKey);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  function applyTheme(theme) {
    root.dataset.theme = theme;
    if (toggle) {
      toggle.textContent = theme === 'dark' ? '浅色' : '深色';
      toggle.setAttribute('aria-pressed', theme === 'dark');
    }
  }

  function toggleTheme() {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem(storageKey, next);
    applyTheme(next);
  }

  applyTheme(getPreferredTheme());
  if (toggle) {
    toggle.addEventListener('click', toggleTheme);
  }
})();
