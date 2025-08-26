// header.js - Fixed version with proper variable scoping
document.addEventListener('DOMContentLoaded', function() {
    // Declare ALL variables at the top - ONCE
    let trustBar = null;
    let breadcrumbNav = null;
    
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

        .trust-bar {
            position: fixed;
            top: 70px;
            left: 0;
            right: 0;
            width: 100%;
            height: 40px;
            background: #F5F7FA;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 1.5rem;
            padding: 0.5rem 1rem;
            box-sizing: border-box;
            z-index: 999;
            border-bottom: 1px solid #E5E9ED;
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
            gap: 2rem;
            align-items: center;
            margin-left: auto;
        }

        .nav-links a {
            text-decoration: none;
            color: #111827;
            font-size: 0.9rem;
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
            padding: 1rem 0;
            min-width: 250px;
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
            padding: 0.75rem 1.5rem;
            color: #111827;
            text-decoration: none;
            transition: all 0.3s;
            font-size: 0.9rem;
            text-transform: none;
        }

        .nav-dropdown-menu a:hover {
            background: #F5F7FA;
            color: #46AEB8;
        }

        .nav-dropdown-menu .featured-link {
            border-bottom: 1px solid #E5E9ED;
            margin-bottom: 0.5rem;
            padding-bottom: 1rem;
            font-weight: 600;
        }

        .nav-cta {
            background: #46AEB8;
            color: #FFFFFF !important;
            padding: 0.75rem 2rem;
            border-radius: 50px;
            font-weight: 600;
            box-shadow: 0 4px 15px rgba(70, 174, 184, 0.3);
        }

        .nav-cta:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 25px rgba(70, 174, 184, 0.4);
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
            padding-top: 110px !important; /* nav (70px) + trust bar (40px) */
            margin-top: 0 !important;
        }

        /* Ensure hero/first section sits flush against trust bar */
        body > section:first-of-type,
        body > .hero,
        .hero-image-container,
        main > section:first-of-type {
            margin-top: 0 !important;
            padding-top: 0 !important;
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
                padding: 2rem;
                border-bottom: 2px solid #46AEB8;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                z-index: 998;
            }
            
            .nav-links.active {
                display: flex !important;
            }

            .nav-dropdown-menu {
                position: static;
                opacity: 1;
                visibility: visible;
                transform: none;
                box-shadow: none;
                border: none;
                padding: 0;
                margin-top: 0;
                width: 100%;
                background: #F5F7FA;
                border-radius: 0;
            }
            
            /* Hide trust bar on mobile */
            .trust-bar {
                display: none !important;
            }
            
            /* Adjust body padding on mobile (only nav height needed) */
            body {
                padding-top: 70px !important;
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
                <a href="/how-it-works.html">HOW IT WORKS</a>
                <a href="/calculator/index.html">ROI CALCULATOR</a>
                <a href="https://www.cloverera.com/pricing/index.html">PRICING</a>
                <div class="nav-dropdown">
                    <a href="/resources-hub/index.html" class="nav-dropdown-toggle">
                        RESOURCES <span style="font-size: 0.8rem;">▼</span>
                    </a>
                    <div class="nav-dropdown-menu">
                        <a href="/clover-framework.html" class="featured-link">🍀 Clover Framework</a>
                        <a href="/what-is-employee-engagement/">What Is Engagement?</a>
                        <a href="/calculator/index.html">ROI Calculator</a>
                        <a href="/assessment/index.html">Free Assessment</a>
                        <a href="/implementation-guide.html">Implementation Guide</a>
                        <a href="https://www.amazon.com/Trillion-Dollar-Problem-Employee-Engagement-ebook/dp/B0CYMC3ST1/ref=sr_1_1?crid=FIA8QK3LNQZ0&dib=eyJ2IjoiMSJ9.QImYjq6qcRR5M5fzSbzy1IVu2_5CiJxenm3uMu8aUcl0Zm3J_AVdoIA1WJCmWs-yufPlRkezuhnJurayQOLazLuWTn1XIlAntqSjdWmn-5yL0PHv6F6l-kA8t0O6EalS.nP4OcL7TscInMWUb8AW18JAlsmsQXTD-oY71REz59EU&dib_tag=se&keywords=The+trillion+Dollar+Problem&qid=1755545687&sprefix=the+trillion+dollar+problem%2Caps%2C258&sr=8-1" class="featured-link">
        📚 The Trillion Dollar Problem Book
    </a>
    <a href="https://www.cloverera.com/neuroscience-of-employee-engagement/index.html">
        🧠 New - Neuroscience of Employee Engagement: Preview Chapter
    </a>
                    </div>
                </div>
                <a href="/#problems">SOLUTIONS</a>
                <a href="https://calendly.com/clive-hays-cloverera/30min" class="nav-cta">BOOK DEMO</a>
            </div>
        </div>
    `;

    // Create trust bar - SIMPLE VERSION
    trustBar = document.createElement('div');
    trustBar.className = 'trust-bar';
    trustBar.innerHTML = `
        <span style="color: #6B7280; display: inline-flex; align-items: center; gap: 0.5rem;">
            <img src="https://www.cloverera.com/images/Employee-resilience-training.png" alt="Beta" style="width: 16px; height: 16px; vertical-align: middle;">
            <strong style="color: #46AEB8;">Fresh from beta</strong> - Limited spots || 
            <strong style="color: #46AEB8;">1% Better</strong> - Everyday 
            <a href="https://cloverera.com/active-employee-engagement-management/index.html"</a>
        </span>
    `;

    // Insert elements
    document.body.insertBefore(nav, document.body.firstChild);
    document.body.insertBefore(trustBar, nav.nextSibling);

    // Mobile menu functionality
    const mobileToggle = document.getElementById('mobileToggle');
    const navLinks = document.getElementById('navLinks');
    
    if (mobileToggle && navLinks) {
        mobileToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });
    }

    console.log('Header loaded successfully');
});
