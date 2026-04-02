(function () {
  const splash = document.getElementById('splash');
  if (!splash) {
    return;
  }

  const navEntry = performance.getEntriesByType('navigation')[0];
  const isReload = navEntry && navEntry.type === 'reload';
  const hasShown = sessionStorage.getItem('splash-shown') === '1';
  const shouldShow = isReload || !hasShown;

  if (!shouldShow) {
    splash.classList.add('hidden');
    document.body.classList.add('hide-brand');
    return;
  }
  sessionStorage.setItem('splash-shown', '1');

  setTimeout(() => {
    splash.classList.add('hidden');
    document.body.classList.add('hide-brand');
  }, 1500);
})();
