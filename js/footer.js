// footer.js - Updated footer with turnover prevention framing
document.addEventListener('DOMContentLoaded', function() {
    // Add footer styles
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        footer {
            background: #1F2937;
            padding: 4rem 2rem 2rem;
        }

        .footer-content {
            max-width: 1200px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 3rem;
            margin-bottom: 3rem;
        }

        .footer-section h4 {
            color: #46AEB8;
            margin-bottom: 1.5rem;
            text-transform: uppercase;
            font-size: 0.85rem;
            letter-spacing: 0.05em;
            font-weight: 600;
        }

        .footer-section ul {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        .footer-section a {
            color: rgba(255, 255, 255, 0.7);
            text-decoration: none;
            display: block;
            padding: 0.4rem 0;
            transition: color 0.3s;
            font-size: 0.9rem;
        }

        .footer-section a:hover {
            color: #FFFFFF;
        }

        .footer-bottom {
            text-align: center;
            padding-top: 2rem;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.6);
            font-size: 0.85rem;
        }

        .footer-bottom a {
            color: rgba(255, 255, 255, 0.6);
            text-decoration: none;
            transition: color 0.3s;
        }

        .footer-bottom a:hover {
            color: #FFFFFF;
        }

        @media (max-width: 768px) {
            footer {
                padding: 3rem 1.5rem 1.5rem;
            }

            .footer-content {
                grid-template-columns: 1fr 1fr;
                gap: 2rem;
            }
        }

        @media (max-width: 480px) {
            .footer-content {
                grid-template-columns: 1fr;
            }
        }
    `;
    document.head.appendChild(styleElement);

    // Create footer element
    const footer = document.createElement('footer');
    footer.setAttribute('aria-label', 'Footer navigation');
    footer.innerHTML = `
        <div class="footer-content">
            <div class="footer-section">
                <h4>WHY PEOPLE LEAVE</h4>
                <ul>
                    <li><a href="/why-employees-leave/">Why Employees Leave</a></li>
                    <li><a href="/turnover-after-restructure/">Turnover After Restructure</a></li>
                    <li><a href="/manager-turnover-problem/">The Manager Problem</a></li>
                    <li><a href="/reduce-employee-turnover.html">Reduce Turnover</a></li>
                </ul>
            </div>
            <div class="footer-section">
                <h4>HOW WE FIX IT</h4>
                <ul>
                    <li><a href="/how-it-works.html">How It Works</a></li>
                    <li><a href="/clover-framework.html">The CLOVER Framework</a></li>
                    <li><a href="/our-science.html">The Science</a></li>
                    <li><a href="/calculator/">ROI Calculator</a></li>
                </ul>
            </div>
            <div class="footer-section">
                <h4>LEARN</h4>
                <ul>
                    <li><a href="/book/">The Trillion Dollar Problem</a></li>
                    <li><a href="/neuroscience-of-employee-engagement/">Neuroscience of Engagement</a></li>
                    <li><a href="/case-studies/">Early Results</a></li>
                    <li><a href="/Blog/">Blog</a></li>
                    <li><a href="/research/">Research</a></li>
                </ul>
            </div>
            <div class="footer-section">
                <h4>GET STARTED</h4>
                <ul>
                    <li><a href="/pricing/">Pricing</a></li>
                    <li><a href="/calculator/">Calculate Your ROI</a></li>
                    <li><a href="/pricing/">Schedule Analysis</a></li>
                    <li><a href="https://app.cloverera.com/login">Sign In</a></li>
                </ul>
            </div>
            <div class="footer-section">
                <h4>COMPANY</h4>
                <ul>
                    <li><a href="/about.html">About Clover ERA</a></li>
                    <li><a href="mailto:contact@cloverera.com">Contact</a></li>
                    <li><a href="/privacy-policy.html">Privacy Policy</a></li>
                    <li><a href="/cookie-policy.html">Cookie Policy</a></li>
                    <li><a href="/terms.html">Terms</a></li>
                </ul>
            </div>
        </div>
        <div class="footer-bottom">
            <p>© CLOVER ERA 2025 | Employee Turnover Prevention Platform</p>
            <p style="margin-top: 0.5rem; font-size: 0.8rem;">
                <a href="#" onclick="openCookiePreferences(); return false;" rel="nofollow">Cookie Settings</a>
            </p>
        </div>
    `;

    // Insert footer at the end of the body
    document.body.appendChild(footer);

    console.log('Footer loaded successfully');
});
