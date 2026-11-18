// Runs before the page paints; React subscribes to the same preference state.
(() => {
  const key = 'gadjitprints-theme';
  const normalize = (value) => ['light', 'dark'].includes(value) ? value : 'system';
  let preference = 'system';
  try { preference = normalize(localStorage.getItem(key)); } catch {}
  let media = null;
  try {
    media = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  } catch {}
  function apply() {
    const theme = preference === 'system' ? (media?.matches ? 'dark' : 'light') : preference;
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.dispatchEvent(new Event('appearancechange'));
  }
  window.gadjitAppearance = {
    getPreference: () => preference,
    setPreference(value) {
      preference = normalize(value);
      try { localStorage.setItem(key, preference); } catch {}
      apply();
    },
  };
  if (media) {
    if (typeof media.addEventListener === 'function') media.addEventListener('change', apply);
    else if (typeof media.addListener === 'function') media.addListener(apply);
  }
  window.addEventListener('storage', (event) => {
    if (event.key === key || event.key === null) {
      preference = normalize(event.newValue);
      apply();
    }
  });
  apply();
})();
