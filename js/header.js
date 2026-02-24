// header.js - Redesign: Clean 5-item navigation

// Google Analytics 4 - Load immediately (before DOM ready)
(function() {
    if (window.gtag) return;
    const gtagScript = document.createElement('script');
    gtagScript.async = true;
    gtagScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-PL5KTHRGLW';
    document.head.appendChild(gtagScript);
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', 'G-PL5KTHRGLW');
})();

// LinkedIn Insight Tag - Load immediately (before DOM ready)
(function() {
    if (window._linkedin_partner_id) return;
    window._linkedin_partner_id = "9495801";
    window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
    window._linkedin_data_partner_ids.push(window._linkedin_partner_id);
    (function(l) {
        if (!l) {
            window.lintrk = function(a, b) { window.lintrk.q.push([a, b]); };
            window.lintrk.q = [];
        }
        var s = document.getElementsByTagName("script")[0];
        var b = document.createElement("script");
        b.type = "text/javascript";
        b.async = true;
        b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
        s.parentNode.insertBefore(b, s);
    })(window.lintrk);
})();

document.addEventListener('DOMContentLoaded', function() {
    // Add favicon if not present
    if (!document.querySelector('link[rel="icon"]')) {
        const favicon = document.createElement('link');
        favicon.rel = 'icon';
        favicon.type = 'image/png';
        favicon.href = '/images/Clover-era-new-logo-1.png';
        document.head.appendChild(favicon);
    }

    // Remove existing navigation elements
    const existingNavs = document.querySelectorAll('nav');
    existingNavs.forEach(nav => {
        if (!nav.classList.contains('main-nav')) {
            nav.remove();
        }
    });

    const headers = document.querySelectorAll('header');
    headers.forEach(header => {
        if (header.querySelector('nav') || header.querySelector('.nav-links') || header.querySelector('.navigation')) {
            header.remove();
        }
    });

    // Navigation styles
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        nav.main-nav {
            position: fixed;
            top: 0;
            width: 100%;
            background: rgba(255, 255, 255, 0.97);
            backdrop-filter: blur(20px);
            z-index: 1000;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
            height: 70px;
        }

        .nav-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            height: 100%;
        }

        .logo {
            font-size: 1.5rem;
            font-weight: 700;
            color: #46AEB8;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            text-decoration: none;
            display: flex;
            align-items: center;
            gap: 0.6rem;
        }

        .logo img {
            height: 32px;
            width: auto;
        }

        .nav-links {
            display: flex;
            gap: 2rem;
            align-items: center;
        }

        .nav-links a {
            text-decoration: none;
            color: #111827;
            font-size: 0.9rem;
            font-weight: 500;
            transition: color 0.2s;
        }

        .nav-links a:hover,
        .nav-links a.nav-active {
            color: #46AEB8;
        }

        .nav-links a.nav-active {
            font-weight: 700;
        }

        .nav-cta-get {
            background: #46AEB8 !important;
            color: #FFFFFF !important;
            padding: 0.65rem 1.5rem;
            border-radius: 8px;
            font-weight: 700 !important;
            font-size: 0.85rem !important;
            transition: all 0.2s;
        }

        .nav-cta-get:hover {
            background: #0D7C88 !important;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(70, 174, 184, 0.3);
        }

        body {
            padding-top: 70px !important;
            margin-top: 0 !important;
        }

        body > section:first-of-type,
        body > .hero,
        main > section:first-of-type {
            margin-top: 0 !important;
        }

        .mobile-menu-toggle {
            display: none;
            flex-direction: column;
            justify-content: space-between;
            width: 28px;
            height: 22px;
            background: transparent;
            border: none;
            cursor: pointer;
            padding: 0;
            z-index: 1001;
        }

        .mobile-menu-toggle span {
            display: block;
            width: 100%;
            height: 3px;
            background: #46AEB8;
            border-radius: 2px;
            transition: all 0.3s ease;
        }

        @media (max-width: 768px) {
            .mobile-menu-toggle {
                display: flex !important;
            }

            .nav-links {
                display: none;
                position: fixed;
                top: 70px;
                left: 0;
                right: 0;
                width: 100%;
                background: #FFFFFF;
                flex-direction: column;
                padding: 1.5rem 2rem;
                border-bottom: 2px solid #46AEB8;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                z-index: 998;
                gap: 0;
            }

            .nav-links.active {
                display: flex !important;
            }

            .nav-links a {
                padding: 0.75rem 0;
                font-size: 1rem;
                border-bottom: 1px solid #F3F4F6;
                width: 100%;
                text-align: center;
            }

            .nav-links a:last-child {
                border-bottom: none;
            }

            .nav-cta-get {
                margin-top: 0.5rem;
                text-align: center;
                width: 100%;
                padding: 0.85rem 1.5rem !important;
            }
        }
    `;
    document.head.appendChild(styleElement);

    // Create navigation
    const nav = document.createElement('nav');
    nav.classList.add('main-nav');
    nav.innerHTML = `
        <div class="nav-container">
            <a href="/" class="logo">
                <img src="/images/Clover-era-new-logo-1.png" alt="Clover ERA">
                CLOVER ERA
            </a>
            <button class="mobile-menu-toggle" id="mobileToggle" aria-label="Menu">
                <span></span>
                <span></span>
                <span></span>
            </button>
            <div class="nav-links" id="navLinks">
                <a href="/how-it-works/">How It Works</a>
                <a href="/pricing/">Pricing</a>
                <a href="/about/">About</a>
                <a href="/book/">Already Gone</a>
                <a href="/get/" class="nav-cta-get">Get Clover ERA</a>
            </div>
        </div>
    `;

    document.body.insertBefore(nav, document.body.firstChild);

    // Active nav state
    const currentPath = window.location.pathname;
    document.querySelectorAll('.nav-links a').forEach(function(link) {
        const href = link.getAttribute('href');
        if (href && href !== '/' && currentPath.startsWith(href)) {
            link.classList.add('nav-active');
        }
    });

    // Mobile menu toggle
    const mobileToggle = document.getElementById('mobileToggle');
    const navLinks = document.getElementById('navLinks');
    if (mobileToggle && navLinks) {
        mobileToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });
    }
});
