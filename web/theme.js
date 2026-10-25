(() => {
  const key = 'orbit.appearance.v1';
  const valid = value => ['system', 'light', 'dark'].includes(value);
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  let preference = 'system';
  try { const saved = localStorage.getItem(key); if (valid(saved)) preference = saved; } catch {}
  function apply() {
    const resolved = preference === 'system' ? (media.matches ? 'dark' : 'light') : preference;
    document.documentElement.dataset.theme = resolved;
    document.documentElement.style.colorScheme = resolved;
    const control = document.getElementById('appearance-preference');
    if (control) control.value = preference;
    window.dispatchEvent(new CustomEvent('orbit-theme-change'));
  }
  window.OrbitTheme = {
    get preference() { return preference; },
    set(value) {
      if (!valid(value)) throw new Error('Choose System, Light or Dark.');
      preference = value;
      apply();
      try { localStorage.setItem(key, value); return true; } catch { return false; }
    }
  };
  media.addEventListener('change', () => { if (preference === 'system') apply(); });
  window.addEventListener('storage', event => {
    if (event.key === key || event.key === null) {
      preference = valid(event.newValue) ? event.newValue : 'system';
      apply();
    }
  });
  apply();
})();
