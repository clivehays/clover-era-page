/* =============================================================
   Clover ERA — shared mobile chrome behaviour
   Toggles the hamburger drawer with a11y bookkeeping.
   Works with two masthead variants (.masthead + nav.primary
   and .topnav + nav).
   ============================================================= */
(function () {
  'use strict';

  function init() {
    var btn = document.querySelector('.hamburger');
    if (!btn) return;

    var navId = btn.getAttribute('aria-controls');
    var nav = navId ? document.getElementById(navId) : null;
    if (!nav) {
      nav = document.querySelector('.masthead nav.primary, .topnav nav');
    }
    if (!nav) return;

    // Backdrop, lazily appended once.
    var backdrop = document.querySelector('.nav-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'nav-backdrop';
      backdrop.setAttribute('aria-hidden', 'true');
      document.body.appendChild(backdrop);
    }

    function setOpen(open) {
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      nav.classList.toggle('open', open);
      backdrop.classList.toggle('open', open);
      document.body.classList.toggle('nav-locked', open);
    }

    btn.addEventListener('click', function () {
      var isOpen = btn.getAttribute('aria-expanded') === 'true';
      setOpen(!isOpen);
    });

    backdrop.addEventListener('click', function () { setOpen(false); });

    // Close when a nav link is activated
    var links = nav.querySelectorAll('a');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', function () { setOpen(false); });
    }

    // Close on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        btn.focus();
      }
    });

    // Close if viewport returns to desktop
    var mq = window.matchMedia('(min-width: 721px)');
    function onMq(e) { if (e.matches) setOpen(false); }
    if (mq.addEventListener) mq.addEventListener('change', onMq);
    else if (mq.addListener) mq.addListener(onMq);
  }

  // === The Work dropdown: tap-to-toggle on touch, hover handled in CSS
  function initDropdowns() {
    var toggles = document.querySelectorAll('.nav-dropdown-toggle');
    if (!toggles.length) return;

    for (var i = 0; i < toggles.length; i++) {
      (function (toggle) {
        var dropdown = toggle.closest('.nav-dropdown');

        toggle.addEventListener('click', function (e) {
          e.stopPropagation();
          var expanded = toggle.getAttribute('aria-expanded') === 'true';
          toggle.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        });

        // Keyboard: Enter/Space toggle, Escape closes, ArrowDown opens & focuses first item
        toggle.addEventListener('keydown', function (e) {
          if (e.key === 'Escape') {
            toggle.setAttribute('aria-expanded', 'false');
            toggle.focus();
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            toggle.setAttribute('aria-expanded', 'true');
            var firstItem = dropdown && dropdown.querySelector('.nav-dropdown-menu a');
            if (firstItem) firstItem.focus();
          }
        });

        // Close on click outside
        document.addEventListener('click', function (e) {
          if (!dropdown.contains(e.target)) {
            toggle.setAttribute('aria-expanded', 'false');
          }
        });
      })(toggles[i]);
    }

    // Escape on any menu item closes the dropdown
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      var openToggles = document.querySelectorAll('.nav-dropdown-toggle[aria-expanded="true"]');
      for (var i = 0; i < openToggles.length; i++) {
        openToggles[i].setAttribute('aria-expanded', 'false');
      }
    });
  }

  // === Cookie consent banner ===
  // Shows on first visit; respects DNT/GPC by defaulting analytics off.
  // Settings page (Cookies.html) reads/writes the same localStorage key.
  function initCookieBanner() {
    // Skip on the Cookies page itself — it has its own settings UI
    if (location.pathname.indexOf('Cookies.html') !== -1 ||
        location.pathname.indexOf('/cookies') !== -1) return;

    var stored = null;
    try { stored = localStorage.getItem('ce_consent'); } catch (e) {}
    if (stored) return; // user has already chosen

    // Default analytics off if DNT or GPC signal is set
    var dnt = (navigator.doNotTrack === '1' || window.doNotTrack === '1' ||
               navigator.doNotTrack === 'yes' ||
               (navigator.globalPrivacyControl === true));

    var banner = document.createElement('div');
    banner.className = 'ce-cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-modal', 'false');
    banner.setAttribute('aria-label', 'Cookie consent');

    banner.innerHTML =
      '<p class="ce-banner-eyebrow">Cookies</p>' +
      '<h3>We use a small number of cookies.</h3>' +
      '<p>Strictly necessary cookies keep the site working. We also use functional and privacy-respecting analytics cookies — you can accept, reject the optional ones, or <a href="Cookies.html">manage preferences</a>.</p>' +
      '<div class="ce-banner-actions">' +
        '<button type="button" class="primary" data-action="accept">Accept all</button>' +
        '<button type="button" data-action="reject">Reject optional</button>' +
        '<a class="ce-banner-link" href="Cookies.html">Manage preferences</a>' +
      '</div>';

    document.body.appendChild(banner);
    // Defer the visible class so the banner can transition in
    requestAnimationFrame(function () { banner.classList.add('visible'); });

    function persist(prefs) {
      try {
        localStorage.setItem('ce_consent', JSON.stringify(prefs));
      } catch (e) {}
    }
    function dismiss() {
      banner.classList.remove('visible');
      setTimeout(function () { banner.parentNode && banner.parentNode.removeChild(banner); }, 220);
    }

    banner.addEventListener('click', function (e) {
      var btn = e.target.closest('button');
      if (!btn) return;
      var action = btn.getAttribute('data-action');
      if (action === 'accept') {
        persist({ necessary: true, functional: true, analytics: !dnt, ts: new Date().toISOString() });
        dismiss();
      } else if (action === 'reject') {
        persist({ necessary: true, functional: false, analytics: false, ts: new Date().toISOString() });
        dismiss();
      }
    });
  }

  function bootstrap() { init(); initDropdowns(); initCookieBanner(); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();
