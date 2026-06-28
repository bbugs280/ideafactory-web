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

  // ---- Ensure product videos never autoplay ----
  document.querySelectorAll('.product-card-video').forEach(function (video) {
    video.autoplay = false;
    video.pause();
    video.currentTime = 0;
  });

  // ---- PawMind demo video switcher ----
  document.querySelectorAll('.product-card').forEach(function (card) {
    var video = card.querySelector('.product-card-video');
    var mainPoster = card.querySelector('.product-card-poster');
    var tabs = card.querySelectorAll('.product-video-tab');
    var posterTabs = card.querySelectorAll('.product-poster-tab');
    var posterIntervalId = null;
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!video || !tabs.length) {
      return;
    }

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var nextSrc = tab.getAttribute('data-video-src');

        if (!nextSrc || video.getAttribute('src') === nextSrc) {
          return;
        }

        video.pause();
        video.src = nextSrc;
        video.load();
        video.currentTime = 0;

        tabs.forEach(function (candidate) {
          candidate.classList.toggle('is-active', candidate === tab);
        });
      });
    });

    function applyPosterTab(posterTab) {
      var nextPoster = posterTab.getAttribute('data-poster-src');

      if (!nextPoster || video.getAttribute('poster') === nextPoster) {
        return;
      }

      if (mainPoster) {
        mainPoster.setAttribute('src', nextPoster);
      }

      video.pause();
      video.setAttribute('poster', nextPoster);
      video.currentTime = 0;
      video.load();

      posterTabs.forEach(function (candidate) {
        candidate.classList.toggle('is-active', candidate === posterTab);
      });
    }

    posterTabs.forEach(function (posterTab) {
      posterTab.addEventListener('click', function () {
        applyPosterTab(posterTab);
      });
    });

    function startPosterAutoplay() {
      if (posterTabs.length < 2 || reduceMotion || posterIntervalId) {
        return;
      }

      posterIntervalId = window.setInterval(function () {
        var activeIndex = 0;

        posterTabs.forEach(function (candidate, index) {
          if (candidate.classList.contains('is-active')) {
            activeIndex = index;
          }
        });

        var nextIndex = (activeIndex + 1) % posterTabs.length;
        applyPosterTab(posterTabs[nextIndex]);
      }, 3500);
    }

    function stopPosterAutoplay() {
      if (!posterIntervalId) {
        return;
      }
      window.clearInterval(posterIntervalId);
      posterIntervalId = null;
    }

    startPosterAutoplay();
    card.addEventListener('mouseenter', stopPosterAutoplay);
    card.addEventListener('mouseleave', startPosterAutoplay);
  });

}());

// ── IdeaFactory AI Chat (embedded) ────────────────────────────────
var ifHistory = [];
var ifChat = document.getElementById('if-chat-messages');
var ifInput = document.getElementById('if-user-input');
var ifSendBtn = document.getElementById('if-send-btn');
var IF_API = 'https://vincentyeung.ddns.net:8090';

function ifAddMsg(text, role) {
  var el = document.createElement('div');
  el.className = 'chat-msg ' + role;
  var label = role === 'guide' ? 'IDEAFACTORY GUIDE' : 'YOU';
  el.innerHTML = '<span class="chat-label">' + label + '</span>' + ifEsc(text);
  ifChat.appendChild(el);
  ifChat.scrollTop = ifChat.scrollHeight;
}

function ifEsc(text) {
  var d = document.createElement('div');
  d.textContent = text;
  return d.innerHTML;
}

function ifSend() {
  var text = ifInput.value.trim();
  if (!text) return;
  ifAddMsg(text, 'user');
  ifInput.value = '';
  ifSendBtn.disabled = true;

  var loadEl = document.createElement('div');
  loadEl.className = 'chat-loading';
  loadEl.innerHTML = '<span class="chat-label">IDEAFACTORY GUIDE</span>Thinking...';
  ifChat.appendChild(loadEl);
  ifChat.scrollTop = ifChat.scrollHeight;

  fetch(IF_API + '/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: text, history: ifHistory, name: '' })
  })
  .then(function(r) { return r.json(); })
  .then(function(d) {
    ifChat.removeChild(loadEl);
    ifAddMsg(d.reply, 'guide');
    ifHistory.push({ role: 'user', content: text }, { role: 'assistant', content: d.reply });
    if (ifHistory.length > 20) ifHistory = ifHistory.slice(-20);
    ifSendBtn.disabled = false;
    ifInput.focus();
  })
  .catch(function() {
    ifChat.removeChild(loadEl);
    ifAddMsg("Sorry, I couldn't connect. Try again in a moment.", 'guide');
    ifSendBtn.disabled = false;
    ifInput.focus();
  });
}

if (ifInput) {
  ifInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') ifSend();
  });
}
