/* Theme toggle: light / dark with system-preference fallback.
   Injects a toggle button into the nav so every page gets it automatically. */
(function () {
  var KEY = 'ap-theme';
  var root = document.documentElement;

  function systemPrefersDark() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  function current() {
    return root.getAttribute('data-theme') || (systemPrefersDark() ? 'dark' : 'light');
  }
  function apply(theme, persist) {
    root.setAttribute('data-theme', theme);
    if (persist) { try { localStorage.setItem(KEY, theme); } catch (e) {} }
    var btn = document.querySelector('.theme-toggle');
    if (btn) {
      btn.textContent = theme === 'dark' ? '\u2600\uFE0E' : '\u263D';
      btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
      btn.title = btn.getAttribute('aria-label');
    }
  }

  // Apply saved theme as early as possible to avoid a flash
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  if (saved === 'light' || saved === 'dark') root.setAttribute('data-theme', saved);

  document.addEventListener('DOMContentLoaded', function () {
    var pageEl = document.getElementById('page');
    if (pageEl) {
      requestAnimationFrame(function () { pageEl.classList.add('is-loaded'); });
    }
    var nav = document.querySelector('.nav-inner');
    if (nav && !document.querySelector('.theme-toggle')) {
      var btn = document.createElement('button');
      btn.className = 'theme-toggle';
      btn.type = 'button';
      btn.addEventListener('click', function () {
        apply(current() === 'dark' ? 'light' : 'dark', true);
      });
      nav.appendChild(btn);
    }
    apply(current(), false);

    // Follow system changes only if the user hasn't chosen manually
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
        var stored = null;
        try { stored = localStorage.getItem(KEY); } catch (err) {}
        if (!stored) apply(e.matches ? 'dark' : 'light', false);
      });
    }
  });
})();
