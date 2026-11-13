/* ==========================================
   IdeaFactory — main.js
   ==========================================
   v2 (2026-11-13): the five-theme colour picker was removed with the
   redesign — see the header comment in style.css for why. What remains:
   sticky-nav scroll state, mobile menu, reveal-on-scroll, footer year.
   ========================================== */

(function () {
  'use strict';

  /* ---- Scroll restoration, 2026-11-13 ----------------------------------
     BUG (reproduced on /gaincut/, and reported by Vincent on iOS Safari):
     loading the page dropped the reader ~2,200px down, landing mid-page at
     the "How it works" section. Nothing in our JS scrolls — the browser was
     replaying a saved scroll offset. The page is ~10,000px tall, so an
     offset saved against an earlier layout lands wherever, and because the
     stylesheet sets `scroll-behavior: smooth` that restore ANIMATES, which
     reads as the page "bouncing" downward on load.

     Fix: take restoration away from the browser. A visitor arriving at the
     top of a marketing page should always start at the top. Hash links
     still work — they are handled below, after the reset. */
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  // Reset before paint on a fresh load that has no anchor to honour.
  if (!window.location.hash && !window.location.search) {
    window.scrollTo(0, 0);
  }

  // ---- Nav: solid background once scrolled ----
  var nav = document.getElementById('nav');
  if (nav) {
    var onScroll = function () {
      if (window.scrollY > 12) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // ---- Mobile menu ----
  var toggle = document.getElementById('nav-toggle');
  var links = document.getElementById('nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    // Close after tapping a link
    links.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        links.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // ---- Reveal on scroll ----
  var reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    if ('IntersectionObserver' in window &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -40px 0px', threshold: 0 });
      reveals.forEach(function (el) { io.observe(el); });

      /* SAFETY NET — measured 2026-11-13.
         The original observer used threshold 0.05 ("5% of the element is
         visible") and unobserved on first fire. Two failure modes came out
         of that, both reproduced on /gaincut/:

         1. TALL BLOCKS. The page has reveal blocks 695px and 622px high in
            a viewport whose usable height is 860px after the -40px
            rootMargin. The ratio can be sampled before it crosses 0.05.
         2. JUMPED-PAST BLOCKS. A reader who scrolls quickly (or lands on an
            anchor further down) moves a block from below the viewport to
            above it between two observer samples. isIntersecting never
            reports true, so the block stays at opacity 0 FOREVER — a
            permanently blank gap mid-page.

         Fix: threshold 0, plus this sweep which also reveals anything whose
         bottom is already ABOVE the viewport top (it has been scrolled past,
         so it should be visible whether or not it was ever sampled).
         Scroll/resize + a short interval guarantee it cannot stick. */
      var sweep = function () {
        for (var i = 0; i < reveals.length; i++) {
          var el = reveals[i];
          if (el.classList.contains('is-visible')) continue;
          var r = el.getBoundingClientRect();
          var inView = r.top < window.innerHeight && r.bottom > 0;
          var passedBy = r.bottom <= 0;
          if (inView || passedBy) {
            el.classList.add('is-visible');
            io.unobserve(el);
          }
        }
      };
      window.addEventListener('scroll', sweep, { passive: true });
      window.addEventListener('resize', sweep, { passive: true });
      sweep();

      // Belt and braces: stop polling once everything is revealed, so this
      // costs nothing after the reader has seen the page.
      var sweepTimer = setInterval(function () {
        sweep();
        var remaining = 0;
        for (var i = 0; i < reveals.length; i++) {
          if (!reveals[i].classList.contains('is-visible')) remaining++;
        }
        if (!remaining) clearInterval(sweepTimer);
      }, 250);
    } else {
      // No IO, or reduced motion: show everything immediately.
      reveals.forEach(function (el) { el.classList.add('is-visible'); });
    }
  }

  // ---- Pointer-follow tilt on product cards ----
  // Only on devices with a real pointer — on touch, a tilt that sticks after
  // tap looks broken. Disabled under reduced-motion for the same reason as
  // every other animation on this page.
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (!reduceMotion && canHover && 'IntersectionObserver' in window) {
    var tiltCards = document.querySelectorAll('.product-card');
    var MAX_DEG = 4; // deliberately small — this is polish, not a gimmick

    tiltCards.forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;   // -0.5 … 0.5
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.classList.add('is-tilting');
        card.style.transform =
          'perspective(900px) rotateY(' + (px * MAX_DEG) + 'deg) ' +
          'rotateX(' + (-py * MAX_DEG) + 'deg) translateY(-3px)';
      });

      card.addEventListener('mouseleave', function () {
        card.classList.remove('is-tilting');
        card.style.transform = '';
      });
    });
  }

  // ---- Footer year ----
  var year = document.getElementById('current-year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---- GA4 conversion events, 2026-11-13 -------------------------------
     BUG: every CTA carried `data-ga="appstore_download"` and
     `data-ga-location`, but NOTHING ever read those attributes. The markup
     looked instrumented, so nobody checked, and zero events had ever fired.
     A dead attribute is worse than no attribute because it reads as done.

     Every click to the App Store is now a `appstore_download` event carrying
     the location (nav / hero / footer) so we can tell which CTA converts.
     `outbound_click` covers non-App-Store external links. */
  function trackEvent(name, params) {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', name, params || {});
  }

  var tracked = document.querySelectorAll('[data-ga]');
  for (var i = 0; i < tracked.length; i++) {
    tracked[i].addEventListener('click', function () {
      trackEvent(this.getAttribute('data-ga'), {
        location: this.getAttribute('data-ga-location') || 'unknown',
        page: window.location.pathname,
        link_url: this.getAttribute('href') || ''
      });
    });
  }

  // Any other off-site link, so no exit goes uncounted.
  var allLinks = document.querySelectorAll('a[href^="http"]');
  for (var j = 0; j < allLinks.length; j++) {
    var a = allLinks[j];
    if (a.hasAttribute('data-ga')) continue;
    if (a.hostname === window.location.hostname) continue;
    a.addEventListener('click', function () {
      trackEvent('outbound_click', {
        link_url: this.getAttribute('href') || '',
        page: window.location.pathname
      });
    });
  }
})();
