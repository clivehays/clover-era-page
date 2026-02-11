// header.js - Updated navigation with pillar page structure

// Google Analytics 4 - Load immediately (before DOM ready)
(function() {
    // Check if gtag is already loaded
    if (window.gtag) return;

    // Load gtag.js script
    const gtagScript = document.createElement('script');
    gtagScript.async = true;
    gtagScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-PL5KTHRGLW';
    document.head.appendChild(gtagScript);

    // Initialize dataLayer and gtag function
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', 'G-PL5KTHRGLW');
})();

// LinkedIn Insight Tag - Load immediately (before DOM ready)
(function() {
    // Check if LinkedIn tracking is already loaded
    if (window._linkedin_partner_id) return;

    // Set Partner ID
    window._linkedin_partner_id = "9495801";
    window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
    window._linkedin_data_partner_ids.push(window._linkedin_partner_id);

    // Load LinkedIn Insight script
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
    // Declare ALL variables at the top - ONCE
    let breadcrumbNav = null;

    // Load breadcrumbs CSS
    if (!document.querySelector('link[href="/css/breadcrumbs.css"]')) {
        const breadcrumbCSS = document.createElement('link');
        breadcrumbCSS.rel = 'stylesheet';
        breadcrumbCSS.href = '/css/breadcrumbs.css';
        document.head.appendChild(breadcrumbCSS);
    }

    // Load breadcrumbs JS
    if (!document.querySelector('script[src="/js/breadcrumbs.js"]')) {
        const breadcrumbScript = document.createElement('script');
        breadcrumbScript.src = '/js/breadcrumbs.js';
        breadcrumbScript.defer = true;
        document.body.appendChild(breadcrumbScript);
    }

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
        if (!nav.classList.contains('main-nav') && !nav.classList.contains('breadcrumb-nav')) {
            nav.remove();
        }
    });

    const headers = document.querySelectorAll('header');
    headers.forEach(header => {
        if (header.querySelector('nav') || header.querySelector('.nav-links') || header.querySelector('.navigation')) {
            header.remove();
        }
    });

    // Add navigation styles
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        nav.main-nav {
            position: fixed;
            top: 0;
            width: 100%;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            z-index: 1000;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
            height: 70px;
        }

        .nav-container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 0.75rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            height: 100%;
        }

        .logo {
            font-size: 1.75rem;
            font-weight: 700;
            color: #46AEB8;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            text-decoration: none;
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .logo img {
            height: 35px;
            width: auto;
        }

        .nav-links {
            display: flex;
            gap: 1.5rem;
            align-items: center;
            margin-left: auto;
        }

        .nav-links a {
            text-decoration: none;
            color: #111827;
            font-size: 0.85rem;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            transition: color 0.3s;
        }

        .nav-links a:hover {
            color: #46AEB8;
        }

        /* Dropdown Styles */
        .nav-dropdown {
            position: relative;
        }

        .nav-dropdown-toggle {
            display: flex;
            align-items: center;
            gap: 0.3rem;
            cursor: pointer;
        }

        .nav-dropdown-menu {
            position: absolute;
            top: 100%;
            left: 0;
            background: #FFFFFF;
            border: 1px solid #E5E9ED;
            border-radius: 10px;
            padding: 0.75rem 0;
            min-width: 280px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            opacity: 0;
            visibility: hidden;
            transform: translateY(-10px);
            transition: all 0.3s;
            margin-top: 0.5rem;
        }

        .nav-dropdown:hover .nav-dropdown-menu {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
        }

        .nav-dropdown-menu a {
            display: block;
            padding: 0.6rem 1.25rem;
            color: #111827;
            text-decoration: none;
            transition: all 0.3s;
            font-size: 0.85rem;
            text-transform: none;
            letter-spacing: 0;
        }

        .nav-dropdown-menu a:hover {
            background: #F5F7FA;
            color: #46AEB8;
        }

        .nav-dropdown-menu .dropdown-description {
            font-size: 0.75rem;
            color: #6B7280;
            margin-top: 0.15rem;
        }

        .nav-dropdown-menu .dropdown-divider {
            height: 1px;
            background: #E5E9ED;
            margin: 0.5rem 0;
        }

        .nav-cta {
            background: #46AEB8;
            color: #FFFFFF !important;
            padding: 0.6rem 1.25rem;
            border-radius: 8px;
            font-weight: 600;
            box-shadow: 0 2px 8px rgba(70, 174, 184, 0.15);
            font-size: 0.8rem !important;
        }

        .nav-cta:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(70, 174, 184, 0.25);
        }

        .nav-signin {
            color: #6B7280 !important;
            font-size: 0.8rem !important;
        }

        .mobile-menu-toggle {
            display: none;
            flex-direction: column;
            justify-content: space-between;
            width: 30px;
            height: 24px;
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

        /* Fix body padding to eliminate white space */
        body {
            padding-top: 70px !important;
            margin-top: 0 !important;
        }

        /* Ensure hero/first section sits flush against nav */
        body > section:first-of-type,
        body > .hero,
        .hero-image-container,
        main > section:first-of-type {
            margin-top: 0 !important;
        }

        @media (max-width: 1600px) {
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
                padding: 2rem;
                border-bottom: 2px solid #46AEB8;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                z-index: 998;
                align-items: center;
                text-align: center;
                max-height: calc(100vh - 70px);
                overflow-y: auto;
            }

            .nav-links.active {
                display: flex !important;
            }

            .nav-dropdown {
                width: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
            }

            .nav-dropdown-toggle {
                justify-content: center;
            }

            .nav-dropdown-menu {
                position: static;
                opacity: 0;
                visibility: hidden;
                max-height: 0;
                overflow: hidden;
                transform: none;
                box-shadow: none;
                border: none;
                padding: 0;
                margin-top: 0;
                width: 100%;
                background: #F5F7FA;
                border-radius: 0;
                transition: all 0.3s ease;
                text-align: center;
            }

            .nav-dropdown-menu a {
                text-align: center;
            }

            .nav-dropdown.active .nav-dropdown-menu {
                opacity: 1;
                visibility: visible;
                max-height: 500px;
                padding: 0.5rem 0;
            }

            .nav-signin {
                order: 10;
                margin-top: 1rem;
                padding-top: 1rem;
                border-top: 1px solid #E5E9ED;
                width: 100%;
            }
        }
    `;
    document.head.appendChild(styleElement);

    // Create main navigation
    const nav = document.createElement('nav');
    nav.classList.add('main-nav');
    nav.innerHTML = `
        <div class="nav-container">
            <a href="/" class="logo">
                <img src="/images/Clover-era-new-logo-1.png" alt="Clover Era">
                CLOVER ERA
            </a>
            <button class="mobile-menu-toggle" id="mobileToggle">
                <span></span>
                <span></span>
                <span></span>
            </button>
            <div class="nav-links" id="navLinks">
                <a href="/platform/">PLATFORM</a>
                <div class="nav-dropdown">
                    <a href="/why-employees-leave/" class="nav-dropdown-toggle">
                        WHY PEOPLE LEAVE <span style="font-size: 0.7rem;">▼</span>
                    </a>
                    <div class="nav-dropdown-menu">
                        <a href="/why-employees-leave/">
                            <strong>Why Employees Leave</strong>
                            <div class="dropdown-description">The 67-day window you're not watching</div>
                        </a>
                        <a href="/turnover-after-restructure/">
                            <strong>Turnover After Restructure</strong>
                            <div class="dropdown-description">Why your best people leave after layoffs</div>
                        </a>
                        <a href="/manager-turnover-problem/">
                            <strong>The Manager Problem</strong>
                            <div class="dropdown-description">Why leaders are your biggest retention risk</div>
                        </a>
                    </div>
                </div>
                <div class="nav-dropdown">
                    <a href="/how-it-works.html" class="nav-dropdown-toggle">
                        HOW IT WORKS <span style="font-size: 0.7rem;">▼</span>
                    </a>
                    <div class="nav-dropdown-menu">
                        <a href="/platform/">
                            <strong>The Platform</strong>
                            <div class="dropdown-description">Manager enablement dashboard</div>
                        </a>
                        <a href="/how-it-works.html">
                            <strong>How It Works</strong>
                            <div class="dropdown-description">From signals to action in 30 seconds</div>
                        </a>
                        <a href="/clover-framework.html">
                            <strong>The CLOVER Framework</strong>
                            <div class="dropdown-description">Six elements that drive retention</div>
                        </a>
                        <a href="/our-science.html">
                            <strong>The Science</strong>
                            <div class="dropdown-description">Research behind the methodology</div>
                        </a>
                    </div>
                </div>
                <div class="nav-dropdown">
                    <a href="/case-studies/" class="nav-dropdown-toggle">
                        PROOF <span style="font-size: 0.7rem;">▼</span>
                    </a>
                    <div class="nav-dropdown-menu">
                        <a href="/case-studies/">
                            <strong>Early Results</strong>
                            <div class="dropdown-description">What users are saying</div>
                        </a>
                        <a href="/calculator/">
                            <strong>ROI Calculator</strong>
                            <div class="dropdown-description">Calculate your turnover cost</div>
                        </a>
                    </div>
                </div>
                <div class="nav-dropdown">
                    <a href="/book/" class="nav-dropdown-toggle">
                        LEARN <span style="font-size: 0.7rem;">▼</span>
                    </a>
                    <div class="nav-dropdown-menu">
                        <a href="/book/">
                            <strong>Already Gone</strong>
                            <div class="dropdown-description">78 signals managers miss</div>
                        </a>
                        <a href="/book/trillion-dollar-problem.html">
                            <strong>The Trillion Dollar Problem</strong>
                            <div class="dropdown-description">Our first book on Amazon</div>
                        </a>
                        <div class="dropdown-divider"></div>
                        <a href="/Blog/">
                            <strong>Blog</strong>
                            <div class="dropdown-description">Articles and insights</div>
                        </a>
                        <a href="/research/">
                            <strong>Research</strong>
                            <div class="dropdown-description">Data and methodology</div>
                        </a>
                    </div>
                </div>
                <div class="nav-dropdown">
                    <a href="/assessment/" class="nav-dropdown-toggle">
                        TOOLS <span style="font-size: 0.7rem;">▼</span>
                    </a>
                    <div class="nav-dropdown-menu">
                        <a href="/assessment/">
                            <strong>Blind Spot Assessment</strong>
                            <div class="dropdown-description">2-minute manager visibility test</div>
                        </a>
                        <a href="/team-health/">
                            <strong>Team Health Assessment</strong>
                            <div class="dropdown-description">5-minute diagnosis for managers</div>
                        </a>
                    </div>
                </div>
                <a href="/pricing/">PRICING</a>
                <a href="https://app.cloverera.com/login" class="nav-signin">SIGN IN</a>
                <a href="/talk.html" class="nav-cta">FREE ANALYSIS</a>
            </div>
        </div>
    `;

    // Insert navigation
    document.body.insertBefore(nav, document.body.firstChild);

    // Mobile menu functionality
    const mobileToggle = document.getElementById('mobileToggle');
    const navLinks = document.getElementById('navLinks');

    if (mobileToggle && navLinks) {
        mobileToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });
    }

    // Mobile dropdown functionality
    const dropdownToggles = document.querySelectorAll('.nav-dropdown-toggle');
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            // Only prevent default on mobile (when hamburger is visible)
            if (window.innerWidth <= 1600) {
                e.preventDefault();
                const dropdown = this.parentElement;
                dropdown.classList.toggle('active');
            }
        });
    });

    console.log('Header loaded successfully');
});
