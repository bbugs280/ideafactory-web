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

  // ---- Theme menu ----
  var themeToggle = document.getElementById('theme-toggle');
  var themeMenu = document.getElementById('theme-menu');
  var themeMenuWrapper = document.getElementById('theme-menu-wrapper');
  var themeOptions = document.querySelectorAll('.theme-option');
  var themes = ['teal', 'green', 'charcoal', 'navy', 'amber'];

  // Load saved theme
  var savedTheme = localStorage.getItem('ideafactory-theme') || 'navy';
  if (themes.includes(savedTheme)) {
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  // Update active indicator
  function updateActiveTheme() {
    var currentTheme = document.documentElement.getAttribute('data-theme') || 'navy';
    themeOptions.forEach(function (option) {
      if (option.getAttribute('data-theme') === currentTheme) {
        option.classList.add('active');
      } else {
        option.classList.remove('active');
      }
    });
  }
  updateActiveTheme();

  // Toggle menu on button click
  if (themeToggle) {
    themeToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      var isOpen = themeMenuWrapper.getAttribute('data-open') === 'true';
      themeMenuWrapper.setAttribute('data-open', String(!isOpen));
      themeToggle.setAttribute('aria-expanded', String(!isOpen));
    });
  }

  // Select theme
  themeOptions.forEach(function (option) {
    option.addEventListener('click', function (e) {
      e.preventDefault();
      var newTheme = this.getAttribute('data-theme');
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('ideafactory-theme', newTheme);
      themeMenuWrapper.setAttribute('data-open', 'false');
      themeToggle.setAttribute('aria-expanded', 'false');
      updateActiveTheme();
    });
  });

  // Close menu on outside click
  document.addEventListener('click', function (e) {
    if (!themeMenuWrapper.contains(e.target)) {
      themeMenuWrapper.setAttribute('data-open', 'false');
      themeToggle.setAttribute('aria-expanded', 'false');
    }
  });

}());
