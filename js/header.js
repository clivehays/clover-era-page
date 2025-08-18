// header.js - Complete working version
document.addEventListener('DOMContentLoaded', function() {
    // First, add the navigation styles if they don't exist
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        /* Navigation Styles */
        nav {
            position: fixed;
            top: 0;
            width: 100%;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            z-index: 1000;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
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
                z-index: 999;
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
        }
    `;
    document.head.appendChild(styleElement);

    // Create the navigation element
    const nav = document.createElement('nav');
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
                <a href="https://www.clover-era.com/how-it-works.html">HOW IT WORKS</a>
                <div class="nav-dropdown">
                    <a href="/resources-hub/index.html" class="nav-dropdown-toggle">
                        RESOURCES <span style="font-size: 0.8rem;">▼</span>
                    </a>
                    <div class="nav-dropdown-menu">
                        <a href="/what-is-employee-engagement/" class="featured-link">📚 What Is Employee Engagement?</a>
                        <a href="/employee-engagement-strategies/">Engagement Strategies</a>
                        <a href="/measure-employee-engagement/">How to Measure</a>
                        <a href="/engagement-best-practices/">Best Practices</a>
                        <a href="/engagement-roi/">ROI of Engagement</a>
                    </div>
                </div>
                <a href="/#problems">PROBLEMS</a>
                <a href="/#calculator">CALCULATOR</a>
                <a href="/assessment/index.html">ASSESSMENT</a>
                <a href="/30-day-free-pilot/index.html" class="nav-cta">START FREE PILOT</a>
            </div>
        </div>
    `;

    // Insert navigation at the beginning of body
    document.body.insertBefore(nav, document.body.firstChild);

    // Add margin to body to account for fixed navigation
    document.body.style.marginTop = '70px';

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
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!navLinks.contains(e.target) && !mobileToggle.contains(e.target)) {
                navLinks.classList.remove('active');
                mobileToggle.classList.remove('active');
                mobileToggle.setAttribute('aria-expanded', 'false');
            }
        });

        // Close mobile menu when clicking a link
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                mobileToggle.classList.remove('active');
                mobileToggle.setAttribute('aria-expanded', 'false');
            });
        });
    }
});
