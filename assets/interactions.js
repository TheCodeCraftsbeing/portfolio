/* Interactive layer — calm, deliberate micro-interactions:
   scroll progress, hero word cascade, scroll-reveal cards, count-up stats,
   cursor spotlight + tilt on cards, active nav marker, copy-email, back-to-top.
   Everything degrades gracefully and respects prefers-reduced-motion. */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;

  document.addEventListener('DOMContentLoaded', function () {
    scrollProgress();
    heroWords();
    activeNav();
    revealOnScroll();
    statCounters();
    cardEffects();
    copyEmail();
    backToTop();
  });

  /* Hairline reading-progress bar along the top edge */
  function scrollProgress() {
    var bar = document.createElement('div');
    bar.className = 'scroll-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    function update() {
      var doc = document.documentElement;
      var max = doc.scrollHeight - doc.clientHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? doc.scrollTop / max : 0) + ')';
    }
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* Headline words rise into place one by one */
  function heroWords() {
    if (reduce) return;
    var h = document.querySelector('.hero-card h2');
    if (!h) return;
    var i = 0;
    function wrap(node) {
      if (node.nodeType === 3) {
        var frag = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          var s = document.createElement('span');
          s.className = 'w';
          s.style.animationDelay = (i++ * 60) + 'ms';
          s.textContent = part;
          frag.appendChild(s);
        });
        node.parentNode.replaceChild(frag, node);
      } else if (node.nodeType === 1) {
        Array.prototype.slice.call(node.childNodes).forEach(wrap);
      }
    }
    Array.prototype.slice.call(h.childNodes).forEach(wrap);
  }

  /* Mark the page you're on in the table-of-contents nav */
  function activeNav() {
    var here = location.pathname.split('/').pop() || 'index.html';
    var links = document.querySelectorAll('.nav-inner a');
    Array.prototype.forEach.call(links, function (a) {
      var href = (a.getAttribute('href') || '').split('/').pop();
      if (href === here) a.setAttribute('aria-current', 'page');
    });
  }

  /* Cards surface as they enter the viewport */
  function revealOnScroll() {
    if (reduce || !('IntersectionObserver' in window)) return;
    var items = document.querySelectorAll('.quick-links article, .content-card');
    if (!items.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        io.unobserve(el);
        el.classList.add('in');
        // Hand the transform back to the hover styles once settled
        setTimeout(function () {
          el.classList.remove('reveal', 'in');
          el.style.transitionDelay = '';
        }, 750 + parseInt(el.style.transitionDelay || 0, 10));
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    Array.prototype.forEach.call(items, function (el, idx) {
      el.classList.add('reveal');
      el.style.transitionDelay = (idx % 3) * 80 + 'ms';
      io.observe(el);
    });
  }

  /* The ledger-line numbers count up when first seen */
  function statCounters() {
    if (reduce || !('IntersectionObserver' in window)) return;
    var stats = document.querySelectorAll('.ops-readout .stat b');
    Array.prototype.forEach.call(stats, function (b) {
      var final = b.textContent;
      var match = final.match(/\d+/);
      if (!match) return;
      var target = parseInt(match[0], 10);
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          io.disconnect();
          var start = null, dur = 1100;
          function step(t) {
            if (start === null) start = t;
            var p = Math.min((t - start) / dur, 1);
            var eased = 1 - Math.pow(1 - p, 3);
            b.textContent = final.replace(/\d+/, String(Math.round(target * eased)));
            if (p < 1) requestAnimationFrame(step);
          }
          requestAnimationFrame(step);
        });
      }, { threshold: 0.6 });
      io.observe(b);
    });
  }

  /* Cursor-tracked spotlight and a whisper of 3D tilt on cards */
  function cardEffects() {
    if (reduce || !finePointer) return;
    var cards = document.querySelectorAll('.quick-links article, .card');
    Array.prototype.forEach.call(cards, function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var x = e.clientX - r.left, y = e.clientY - r.top;
        card.style.setProperty('--mx', (x / r.width * 100) + '%');
        card.style.setProperty('--my', (y / r.height * 100) + '%');
        var rx = ((y / r.height) - 0.5) * -3;
        var ry = ((x / r.width) - 0.5) * 3;
        card.style.transform =
          'perspective(900px) translateY(-4px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
      });
      card.addEventListener('mouseleave', function () {
        card.style.transform = '';
      });
    });
  }

  /* One-click copy for the email address on the contact page */
  function copyEmail() {
    if (!navigator.clipboard) return;
    var link = document.querySelector('main a[href^="mailto:"]');
    if (!link) return;
    var card = link.closest('article');
    if (!card) return;
    var email = link.getAttribute('href').replace('mailto:', '');
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copy-email';
    btn.textContent = 'copy address';
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      navigator.clipboard.writeText(email).then(function () {
        btn.textContent = 'copied ✓';
        btn.classList.add('done');
        setTimeout(function () {
          btn.textContent = 'copy address';
          btn.classList.remove('done');
        }, 1800);
      });
    });
    card.appendChild(btn);
  }

  /* Quiet back-to-top control once you've scrolled a while */
  function backToTop() {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'to-top';
    btn.innerHTML = '↑';
    btn.setAttribute('aria-label', 'Back to top');
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
    document.body.appendChild(btn);
    function toggle() { btn.classList.toggle('show', window.scrollY > 600); }
    window.addEventListener('scroll', toggle, { passive: true });
    toggle();
  }
})();
