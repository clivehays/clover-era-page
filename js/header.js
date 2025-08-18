// header.js - Complete version with breadcrumb creation
document.addEventListener('DOMContentLoaded', function() {
    // Add favicon if not present
    if (!document.querySelector('link[rel="icon"]')) {
        const favicon = document.createElement('link');
        favicon.rel = 'icon';
        favicon.type = 'image/png';
        favicon.href = '/images/Clover-era-new-logo-1.png';
        document.head.appendChild(favicon);
    }

    // Remove ALL existing navigation elements that might conflict
    const existingNavs = document.querySelectorAll('nav');
    existingNavs.forEach(nav => {
        // Remove any nav that isn't our main-nav or breadcrumb-nav
        if (!nav.classList.contains('main-nav') && !nav.classList.contains('breadcrumb-nav')) {
            console.log('Removing existing nav:', nav);
            nav.remove();
        }
    });
    
    // Also remove any header elements that contain navigation
    const headers = document.querySelectorAll('header');
    headers.forEach(header => {
        // Check if header contains nav elements or nav-like classes
        if (header.querySelector('nav') || header.querySelector('.nav-links') || header.querySelector('.navigation')) {
            console.log('Removing header with nav:', header);
            header.remove();
        }
    });
    
    // Remove any existing breadcrumb sections that aren't ours
    const existingBreadcrumbs = document.querySelectorAll('.breadcrumb');
    existingBreadcrumbs.forEach(bc => {
        if (!bc.classList.contains('breadcrumb-nav')) {
            console.log('Removing existing breadcrumb:', bc);
            bc.remove();
        }
    });

    // Add the navigation styles
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        /* Navigation Styles */
        nav.main-nav {
            position: fixed;
            top: 0;
            width: 100%;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            z-index: 1000;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
            border-bottom: none !important;
        }

        .nav-container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 1rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
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
            display: block;
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

        .mobile-menu-toggle.active span:nth-child(1) {
            transform: rotate(45deg) translate(7px, 7px);
        }

        .mobile-menu-toggle.active span:nth-child(2) {
            opacity: 0;
        }

        .mobile-menu-toggle.active span:nth-child(3) {
            transform: rotate(-45deg) translate(7px, -7px);
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
            background: #FF6B6B;
            color: #FFFFFF !important;
            padding: 0.75rem 2rem;
            border-radius: 50px;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.3s;
            box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
        }

        .nav-cta:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 25px rgba(255, 107, 107, 0.4);
            color: #FFFFFF !important;
        }

        /* Breadcrumb Styles */
        .breadcrumb-nav {
            position: fixed !important;
            top: 70px !important;
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
            padding: 1rem 2rem !important;
            background: rgba(250, 251, 252, 0.95) !important;
            border-bottom: 1px solid #E5E9ED !important;
            z-index: 999 !important;
            display: block !important; /* Force display */
            visibility: visible !important; /* Force visibility */
            opacity: 1 !important;
            margin: 0 !important;
            box-sizing: border-box !important;
        }

        .breadcrumb-nav ol {
            list-style: none !important;
            display: flex !important;
            align-items: center !important;
            gap: 0.5rem !important;
            margin: 0 auto !important;
            padding: 0 !important;
            font-size: 0.9rem !important;
            max-width: 1400px !important;
        }

        .breadcrumb-nav li {
            color: #6B7280;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .breadcrumb-nav li:not(:last-child)::after {
            content: '/';
            color: #E5E9ED;
            margin-left: 0.5rem;
        }

        .breadcrumb-nav a {
            color: #46AEB8;
            text-decoration: none;
            font-weight: 500;
            transition: all 0.3s;
        }

        .breadcrumb-nav a:hover {
            text-decoration: underline;
        }

        .breadcrumb-nav li:last-child {
            color: #111827;
            font-weight: 600;
        }

        /* Adjust body and hero for navigation */
        body {
            padding-top: 70px !important; /* Just main nav height */
            margin-top: 0 !important;
        }
        
        body.has-breadcrumb {
            padding-top: 120px !important; /* Main nav + breadcrumb on other pages */
        }

        /* Remove top margin only from the immediate container after nav */
        body > div:first-of-type,
        body > section:first-of-type,
        body > main:first-of-type,
        body > nav.main-nav + *,
        body > nav.main-nav + nav + * {
            margin-top: 0 !important;
        }
        
        /* Specifically target hero image containers to sit flush */
        .hero-image-container {
            margin-top: 0 !important;
            border-top: none !important;
        }
        
        /* Remove any borders between nav and content */
        nav.main-nav {
            border-bottom: none !important;
        }
        
        nav.main-nav + * {
            border-top: none !important;
        }

        /* Mobile Responsive */
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
                margin-left: 0;
                max-height: calc(100vh - 70px);
                overflow-y: auto;
            }
            
            .nav-links.active {
                display: flex !important;
            }
            
            .nav-links a {
                padding: 1rem 0;
                border-bottom: 1px solid #E5E9ED;
                width: 100%;
                text-align: center;
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
            
            .nav-cta {
                margin-top: 1rem;
                width: 100%;
                text-align: center;
            }

            .breadcrumb-nav {
                top: 70px;
                padding: 0.75rem 1rem;
            }

            .breadcrumb-nav ol {
                font-size: 0.8rem;
            }

            body {
                padding-top: 70px !important;
            }
            
            body.has-breadcrumb {
                padding-top: 110px !important;
            }
            
            /* Remove top margin from immediate container after nav on mobile */
            body > div:first-of-type,
            body > section:first-of-type,
            body > nav.main-nav + * {
                margin-top: 0 !important;
            }
        }
    `;
    document.head.appendChild(styleElement);

    // Create the main navigation element
    const nav = document.createElement('nav');
    nav.classList.add('main-nav');
    nav.setAttribute('aria-label', 'Main navigation');
    nav.innerHTML = `
        <div class="nav-container">
            <a href="/" class="logo" aria-label="Clover Era Home">
                <img src="/images/Clover-era-new-logo-1.png" alt="Clover Era Logo - Employee Engagement Platform" width="35" height="35">
                CLOVER ERA
            </a>
            <button class="mobile-menu-toggle" id="mobileToggle" aria-label="Menu" aria-expanded="false">
                <span></span>
                <span></span>
                <span></span>
            </button>
            <div class="nav-links" id="navLinks">
                <a href="/how-it-works.html">HOW IT WORKS</a>
                <div class="nav-dropdown">
                    <a href="/resources-hub/index.html" class="nav-dropdown-toggle">
                        RESOURCES <span style="font-size: 0.8rem;">▼</span>
                    </a>
                    <div class="nav-dropdown-menu">
                        <a href="/what-is-employee-engagement/" class="featured-link">📚 What Is Employee Engagement?</a>
                        <a href="https://www.cloverera.com/engagement-strategies/index.html">Engagement Strategies</a>
                        <a href="/measure-employee-engagement/">How to Measure</a>
                        <a href="/engagement-best-practices/">Best Practices</a>
                        <a href="/calculator/index.html">ROI of Engagement</a>
                    </div>
                </div>
                <a href="/#problems">PROBLEMS</a>
                <a href="/#calculator">CALCULATOR</a>
                <a href="/assessment/index.html">ASSESSMENT</a>
                <a href="/30-day-free-pilot/index.html" class="nav-cta">START FREE PILOT</a>
            </div>
        </div>
    `;

    // Determine if we need breadcrumbs (not on home page)
    let currentPath = window.location.pathname;
    
    // Normalize path - remove index.html and trailing slashes
    currentPath = currentPath.replace('/index.html', '').replace('/index.htm', '');
    if (currentPath.endsWith('/') && currentPath.length > 1) {
        currentPath = currentPath.slice(0, -1);
    }
    
    const isHomePage = currentPath === '' || currentPath === '/';
    
    // Add class to body if we have breadcrumbs
    if (!isHomePage) {
        document.body.classList.add('has-breadcrumb');
    }
    
    // Debug logging
    console.log('Current path:', currentPath);
    console.log('Is home page:', isHomePage);
    
    let breadcrumbNav = null;
    
    // Always show breadcrumbs except on home page
    if (!isHomePage) {
        // Create breadcrumb navigation for all non-home pages
        breadcrumbNav = document.createElement('nav');
        breadcrumbNav.classList.add('breadcrumb-nav');
        breadcrumbNav.setAttribute('aria-label', 'Breadcrumb navigation');
        
        let breadcrumbHTML = '<ol>';
        
        // Always start with Home
        breadcrumbHTML += '<li><a href="/">Home</a></li>';
        
        // Add page-specific breadcrumbs based on URL
        if (currentPath.includes('/burnout')) {
            breadcrumbHTML += '<li><a href="/#problems">Problems</a></li>';
            breadcrumbHTML += '<li>Employee Burnout</li>';
        } else if (currentPath.includes('/stress')) {
            breadcrumbHTML += '<li><a href="/#problems">Problems</a></li>';
            breadcrumbHTML += '<li>Employee Stress</li>';
        } else if (currentPath.includes('/anxiety')) {
            breadcrumbHTML += '<li><a href="/#problems">Problems</a></li>';
            breadcrumbHTML += '<li>Workplace Anxiety</li>';
        } else if (currentPath.includes('/change-fatigue')) {
            breadcrumbHTML += '<li><a href="/#problems">Problems</a></li>';
            breadcrumbHTML += '<li>Change Fatigue</li>';
        } else if (currentPath.includes('/turnover')) {
            breadcrumbHTML += '<li><a href="/#problems">Problems</a></li>';
            breadcrumbHTML += '<li>Employee Turnover</li>';
        } else if (currentPath.includes('/retention')) {
            breadcrumbHTML += '<li><a href="/#problems">Problems</a></li>';
            breadcrumbHTML += '<li>Employee Retention</li>';
        } else if (currentPath.includes('/what-is-employee-engagement')) {
            breadcrumbHTML += '<li><a href="/resources-hub/index.html">Resources</a></li>';
            breadcrumbHTML += '<li>What Is Employee Engagement</li>';
        } else if (currentPath.includes('/employee-engagement-strategies')) {
            breadcrumbHTML += '<li><a href="/resources-hub/index.html">Resources</a></li>';
            breadcrumbHTML += '<li>Engagement Strategies</li>';
        } else if (currentPath.includes('/measure-employee-engagement')) {
            breadcrumbHTML += '<li><a href="/resources-hub/index.html">Resources</a></li>';
            breadcrumbHTML += '<li>How to Measure</li>';
        } else if (currentPath.includes('/engagement-best-practices')) {
            breadcrumbHTML += '<li><a href="/resources-hub/index.html">Resources</a></li>';
            breadcrumbHTML += '<li>Best Practices</li>';
        } else if (currentPath.includes('/engagement')) {
            breadcrumbHTML += '<li><a href="/#problems">Problems</a></li>';
            breadcrumbHTML += '<li>Employee Engagement</li>';
        } else if (currentPath.includes('/assessment')) {
            breadcrumbHTML += '<li>Assessment</li>';
        } else if (currentPath.includes('/calculator')) {
            breadcrumbHTML += '<li>Calculator</li>';
        } else if (currentPath.includes('/pilot') || currentPath.includes('/30-day')) {
            breadcrumbHTML += '<li>Free Pilot</li>';
        } else if (currentPath.includes('/resources-hub')) {
            breadcrumbHTML += '<li>Resources</li>';
        } else if (currentPath.includes('/resources')) {
            breadcrumbHTML += '<li>Resources</li>';
        } else if (currentPath.includes('/how-it-works')) {
            breadcrumbHTML += '<li>How It Works</li>';
        } else if (currentPath.includes('/about')) {
            breadcrumbHTML += '<li>About</li>';
        } else if (currentPath.includes('/contact')) {
            breadcrumbHTML += '<li>Contact</li>';
        } else if (currentPath.includes('/privacy')) {
            breadcrumbHTML += '<li>Privacy Policy</li>';
        } else if (currentPath.includes('/terms')) {
            breadcrumbHTML += '<li>Terms of Service</li>';
        } else {
            // For any other page, try to create a breadcrumb from the URL
            const pathParts = currentPath.split('/').filter(part => part);
            if (pathParts.length > 0) {
                // Convert URL slug to readable text (e.g., "mental-health" -> "Mental Health")
                const pageName = pathParts[pathParts.length - 1]
                    .replace(/-/g, ' ')
                    .replace(/\b\w/g, l => l.toUpperCase());
                breadcrumbHTML += '<li>' + pageName + '</li>';
            }
        }
        
        breadcrumbHTML += '</ol>';
        breadcrumbNav.innerHTML = breadcrumbHTML;
        
        console.log('Creating breadcrumb with HTML:', breadcrumbHTML);
    }

    // Insert main navigation at the beginning of body
    document.body.insertBefore(nav, document.body.firstChild);
    
    // Insert breadcrumb after main nav if it exists
    if (breadcrumbNav) {
        document.body.insertBefore(breadcrumbNav, nav.nextSibling);
        console.log('Breadcrumb inserted');
        
        // Force breadcrumb visibility
        breadcrumbNav.style.display = 'block';
        breadcrumbNav.style.visibility = 'visible';
        breadcrumbNav.style.opacity = '1';
    }
    
    // Adjust body padding/margin and first content element
    if (!isHomePage) {
        // For pages with breadcrumbs
        document.body.style.paddingTop = '120px';
        document.body.style.marginTop = '0';
        
        // Find the first major content section and adjust it
        const firstSection = document.querySelector('section, main, .hero, article');
        if (firstSection) {
            firstSection.style.marginTop = '0';
            console.log('Adjusted first section margin');
        }
    } else {
        // For home page
        document.body.style.paddingTop = '70px';
        document.body.style.marginTop = '0';
    }

    // Initialize mobile menu functionality
    const mobileToggle = document.getElementById('mobileToggle');
    const navLinks = document.getElementById('navLinks');
    
    if (mobileToggle && navLinks) {
        mobileToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            navLinks.classList.toggle('active');
            mobileToggle.classList.toggle('active');
            const isExpanded = navLinks.classList.contains('active');
            mobileToggle.setAttribute('aria-expanded', isExpanded);
            
            // Adjust breadcrumb position when mobile menu is open
            if (isExpanded && window.innerWidth <= 768) {
                if (breadcrumbNav) breadcrumbNav.style.display = 'none';
            } else {
                if (breadcrumbNav) breadcrumbNav.style.display = 'block';
            }
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!navLinks.contains(e.target) && !mobileToggle.contains(e.target)) {
                navLinks.classList.remove('active');
                mobileToggle.classList.remove('active');
                mobileToggle.setAttribute('aria-expanded', 'false');
                breadcrumbNav.style.display = 'block';
            }
        });

        // Close mobile menu when clicking a link
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                mobileToggle.classList.remove('active');
                mobileToggle.setAttribute('aria-expanded', 'false');
                breadcrumbNav.style.display = 'block';
            });
        });
    }
});
