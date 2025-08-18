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

        body {
            padding-top: 110px !important;
            margin-top: 0 !important;
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
                <a href="/pricing">PRICING</a>
                <a href="/#problems">SOLUTIONS</a>
                <a href="https://calendly.com/clive-hays-cloverera/30min" class="nav-cta">BOOK DEMO</a>
            </div>
        </div>
    `;

    // Create trust bar - SIMPLE VERSION
    trustBar = document.createElement('div');
    trustBar.className = 'trust-bar';
    trustBar.innerHTML = `
        <span style="color: #6B7280;">🏢 <strong style="color: #46AEB8;">12+ companies</strong> already transforming</span>
        <span style="color: #6B7280;">✅ <strong style="color: #46AEB8;">100%</strong> continued after trial</span>
        <span style="color: #6B7280;">🚀 <strong style="color: #46AEB8;">Fresh from beta</strong> - Limited spots</span>
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
