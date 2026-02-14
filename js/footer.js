// footer.js - Redesign: Simplified footer
document.addEventListener('DOMContentLoaded', function() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        footer.site-footer {
            background: #1F2937;
            padding: 3.5rem 2rem 2rem;
        }

        .footer-inner {
            max-width: 900px;
            margin: 0 auto;
        }

        .footer-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 3rem;
            margin-bottom: 2.5rem;
        }

        .footer-brand .footer-logo {
            font-size: 1.25rem;
            font-weight: 700;
            color: #46AEB8;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            text-decoration: none;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .footer-brand .footer-logo img {
            height: 28px;
            width: auto;
        }

        .footer-brand .footer-contact {
            margin-top: 1rem;
            font-size: 0.9rem;
            color: rgba(255, 255, 255, 0.6);
        }

        .footer-brand .footer-contact a {
            color: rgba(255, 255, 255, 0.8);
            text-decoration: none;
            transition: color 0.2s;
        }

        .footer-brand .footer-contact a:hover {
            color: #FFFFFF;
        }

        .footer-brand .footer-social {
            margin-top: 0.75rem;
        }

        .footer-brand .footer-social a {
            color: rgba(255, 255, 255, 0.6);
            text-decoration: none;
            font-size: 0.9rem;
            transition: color 0.2s;
        }

        .footer-brand .footer-social a:hover {
            color: #46AEB8;
        }

        .footer-links {
            display: flex;
            gap: 3rem;
        }

        .footer-links ul {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        .footer-links a {
            color: rgba(255, 255, 255, 0.65);
            text-decoration: none;
            display: block;
            padding: 0.35rem 0;
            transition: color 0.2s;
            font-size: 0.9rem;
        }

        .footer-links a:hover {
            color: #FFFFFF;
        }

        .footer-divider {
            border: none;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            margin: 0 0 1.5rem;
        }

        .footer-privacy {
            font-size: 0.85rem;
            color: rgba(255, 255, 255, 0.5);
            line-height: 1.7;
            margin-bottom: 1.5rem;
            max-width: 700px;
        }

        .footer-bottom {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.8rem;
            color: rgba(255, 255, 255, 0.4);
        }

        .footer-bottom a {
            color: rgba(255, 255, 255, 0.4);
            text-decoration: none;
            transition: color 0.2s;
        }

        .footer-bottom a:hover {
            color: #FFFFFF;
        }

        .footer-legal {
            display: flex;
            gap: 1.5rem;
        }

        @media (max-width: 768px) {
            .footer-top {
                flex-direction: column;
                gap: 2rem;
            }

            .footer-links {
                flex-direction: column;
                gap: 1rem;
            }

            .footer-bottom {
                flex-direction: column;
                gap: 0.75rem;
                text-align: center;
            }

            .footer-legal {
                justify-content: center;
            }
        }
    `;
    document.head.appendChild(styleElement);

    const footer = document.createElement('footer');
    footer.classList.add('site-footer');
    footer.setAttribute('aria-label', 'Footer');
    footer.innerHTML = `
        <div class="footer-inner">
            <div class="footer-top">
                <div class="footer-brand">
                    <a href="/" class="footer-logo">
                        <img src="/images/Clover-era-new-logo-1.png" alt="Clover ERA">
                        CLOVER ERA
                    </a>
                    <div class="footer-contact">
                        <a href="mailto:contact@cloverera.com">contact@cloverera.com</a>
                    </div>
                    <div class="footer-social">
                        <a href="https://www.linkedin.com/company/clover-era/" target="_blank" rel="noopener">LinkedIn</a>
                    </div>
                </div>
                <div class="footer-links">
                    <ul>
                        <li><a href="/how-it-works/">How It Works</a></li>
                        <li><a href="/pricing/">Pricing</a></li>
                        <li><a href="/about/">About</a></li>
                    </ul>
                    <ul>
                        <li><a href="/book/">Already Gone</a></li>
                        <li><a href="/clover-framework/">CLOVER Framework</a></li>
                        <li><a href="/calculator/">Calculator</a></li>
                    </ul>
                </div>
            </div>
            <hr class="footer-divider">
            <p class="footer-privacy">Clover ERA shows TEAM-level patterns, not individual employee data. Retention is an outcome, not surveillance.</p>
            <div class="footer-bottom">
                <span>&copy; 2026 Clover ERA. All rights reserved.</span>
                <div class="footer-legal">
                    <a href="/privacy-policy.html">Privacy</a>
                    <a href="/terms.html">Terms</a>
                    <a href="#" onclick="if(typeof openCookiePreferences==='function')openCookiePreferences();return false;" rel="nofollow">Cookies</a>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(footer);
});
