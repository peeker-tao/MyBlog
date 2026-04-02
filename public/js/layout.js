(function () {
  const storageKey = 'card-layout';
  const toggle = document.getElementById('layout-toggle');
  const body = document.body;

  function getLayout() {
    const saved = localStorage.getItem(storageKey);
    return saved === 'grid' || saved === 'single' ? saved : 'single';
  }

  function applyLayout(layout) {
    body.dataset.cardLayout = layout;
    if (toggle) {
      toggle.textContent = layout === 'grid' ? '列表：双列' : '列表：单列';
      toggle.setAttribute('aria-pressed', layout === 'grid');
    }
  }

  function toggleLayout() {
    const next = body.dataset.cardLayout === 'grid' ? 'single' : 'grid';
    localStorage.setItem(storageKey, next);
    applyLayout(next);
  }

  applyLayout(getLayout());
  if (toggle) {
    toggle.addEventListener('click', toggleLayout);
  }
})();
