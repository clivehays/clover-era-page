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

  function bootstrap() { init(); initDropdowns(); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();
