/* ==========================================
   IdeaFactory — main.js
   ==========================================
   v2 (2026-11-13): the five-theme colour picker was removed with the
   redesign — see the header comment in style.css for why. What remains:
   sticky-nav scroll state, mobile menu, reveal-on-scroll, footer year.
   ========================================== */

(function () {
  'use strict';

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
      }, { rootMargin: '0px 0px -40px 0px', threshold: 0.05 });
      reveals.forEach(function (el) { io.observe(el); });
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
})();
