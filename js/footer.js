// footer.js - Centralized footer for all pages
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
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 3rem;
            margin-bottom: 3rem;
        }

        .footer-section h4 {
            color: #46AEB8;
            margin-bottom: 1.5rem;
            text-transform: uppercase;
            font-size: 0.9rem;
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
            padding: 0.5rem 0;
            transition: color 0.3s;
            font-size: 0.95rem;
        }

        .footer-section a:hover {
            color: #FFFFFF;
        }

        .footer-bottom {
            text-align: center;
            padding-top: 2rem;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.6);
            font-size: 0.9rem;
        }

        @media (max-width: 768px) {
            footer {
                padding: 3rem 1.5rem 1.5rem;
            }

            .footer-content {
                grid-template-columns: 1fr;
                gap: 2rem;
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
                <h4>ENGAGEMENT RESOURCES</h4>
                <ul>
                    <li><a href="/what-is-employee-engagement/">What Is Employee Engagement?</a></li>
                    <li><a href="/engagement-strategies/">Engagement Strategies</a></li>
                    <li><a href="/how-to-measure-employee-engagement/">How to Measure Engagement</a></li>
                    <li><a href="/employee-engagement-best-practices/">Best Practices</a></li>
                    <li><a href="/how-it-works.html">How It Works</a></li>
                </ul>
            </div>
            <div class="footer-section">
                <h4>PROBLEMS WE SOLVE</h4>
                <ul>
                    <li><a href="/burnout/">Burnout Prevention</a></li>
                    <li><a href="/employee-stress/">Stress Management</a></li>
                    <li><a href="/retention-crisis/">Retention Solutions</a></li>
                    <li><a href="/workplace-anxiety/">Anxiety Solutions</a></li>
                    <li><a href="/hybrid-working-issues/">Hybrid Work</a></li>
                </ul>
            </div>
            <div class="footer-section">
                <h4>RESOURCES</h4>
                <ul>
                    <li><a href="/Blog/">Blog</a></li>
                    <li><a href="/how-it-works.html">How It Works</a></li>
                    <li><a href="/our-science.html">The CLOVER Framework</a></li>
                    <li><a href="/calculator/">ROI Calculator</a></li>
                </ul>
            </div>
            <div class="footer-section">
                <h4>GET STARTED</h4>
                <ul>
                    <li><a href="/calculator/">ROI Calculator</a></li>
                    <li><a href="/assessment/">Free Assessment</a></li>
                    <li><a href="/early-adopter-program.html">🚀 Early Adopter Program</a></li>
                    <li><a href="/30-day-free-pilot/">30-Day Free Trial</a></li>
                    <li><a href="/contact.html">Contact Us</a></li>
                </ul>
            </div>
            <div class="footer-section">
                <h4>COMPANY</h4>
                <ul>
                    <li><a href="/about.html">About Clover Era</a></li>
                    <li><a href="/our-science.html">Our Science</a></li>
                    <li><a href="/privacy-policy.html">Privacy Policy</a></li>
                    <li><a href="/cookie-policy.html">Cookie Policy</a></li>
                    <li><a href="#" onclick="openCookiePreferences(); return false;" rel="nofollow">Cookie Settings</a></li>
                    <li><a href="/terms.html">Terms</a></li>
                </ul>
            </div>
        </div>
        <div class="footer-bottom">
            <p>© CLOVER ERA 2025 | Employee Engagement Platform</p>
        </div>
    `;

    // Insert footer at the end of the body
    document.body.appendChild(footer);

    console.log('Footer loaded successfully');
});
