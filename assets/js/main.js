/* global document, window */
(function () {
  'use strict';

  // ---- Nav scroll effect ----
  var nav = document.getElementById('nav');

  function onScroll() {
    if (window.scrollY > 20) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // apply on load

  // ---- Mobile nav toggle ----
  var navToggle = document.getElementById('nav-toggle');
  var navLinks  = document.getElementById('nav-links');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      var isOpen = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    // Close when a link is tapped
    navLinks.querySelectorAll('.nav-link').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });

    // Close on outside click / tap
    document.addEventListener('click', function (e) {
      if (!nav.contains(e.target)) {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // ---- Keep copyright year current ----
  var yearEl = document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  // ---- Theme toggle ----
  var themeToggle = document.getElementById('theme-toggle');
  var themes = ['teal', 'amber'];
  var currentThemeIndex = 0;

  // Load saved theme
  var savedTheme = localStorage.getItem('ideafactory-theme') || 'teal';
  if (themes.includes(savedTheme)) {
    document.documentElement.setAttribute('data-theme', savedTheme);
    currentThemeIndex = themes.indexOf(savedTheme);
  }

  // Toggle theme on click
  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      currentThemeIndex = (currentThemeIndex + 1) % themes.length;
      var newTheme = themes[currentThemeIndex];
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('ideafactory-theme', newTheme);
    });
  }

}());
