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
                    <li><a href="/implementation-guide.html">Implementation Guide</a></li>
                    <li><a href="/team-coaching/">Team Coaching</a></li>
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
                <h4>FREE TOOLS</h4>
                <ul>
                    <li><a href="/team-health/">Team Health Assessment</a></li>

                    <li><a href="/calculator/">ROI Calculator</a></li>
                </ul>
            </div>
            <div class="footer-section">
                <h4>GET STARTED</h4>
                <ul>
                    <li><a href="/pricing/">Pricing</a></li>
                    <li><a href="/talk.html">Schedule Analysis</a></li>
                    <li><a href="/roundtable/">Manager Roundtable</a></li>
                    <li><a href="/signal/">The Signal</a></li>
                    <li><a href="https://app.cloverera.com/login">Sign In</a></li>
                </ul>
            </div>
            <div class="footer-section">
                <h4>COMPANY</h4>
                <ul>
                    <li><a href="/about.html">About Clover ERA</a></li>
                    <li><a href="/contact.html">Contact</a></li>
                    <li><a href="/privacy-policy.html">Privacy Policy</a></li>
                    <li><a href="/cookie-policy.html">Cookie Policy</a></li>
                    <li><a href="/terms.html">Terms</a></li>
                </ul>
            </div>
        </div>
        <div class="footer-bottom">
            <p>© CLOVER ERA 2026 | Employee Turnover Prevention Platform</p>
            <p style="margin-top: 0.5rem; font-size: 0.8rem;">
                <a href="#" onclick="openCookiePreferences(); return false;" rel="nofollow">Cookie Settings</a>
            </p>
        </div>
    `;

    // Insert footer at the end of the body
    document.body.appendChild(footer);

    // =============================================
    // BOOK LAUNCH POPUP - Already Gone (Feb 6-11)
    // =============================================
    (function() {
        // Don't show after Feb 11, 2026
        const expiryDate = new Date('2026-02-12T00:00:00');
        if (new Date() > expiryDate) return;

        // Don't show on the book page itself
        if (window.location.pathname.includes('/alreadygone')) return;

        // Don't show if already dismissed or signed up
        if (localStorage.getItem('book_popup_dismissed')) return;

        // Add popup styles
        const popupStyles = document.createElement('style');
        popupStyles.textContent = `
            .book-popup-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.3s, visibility 0.3s;
            }
            .book-popup-overlay.active {
                opacity: 1;
                visibility: visible;
            }
            .book-popup {
                background: #FFFFFF;
                border-radius: 12px;
                max-width: 420px;
                width: 90%;
                padding: 2.5rem;
                position: relative;
                transform: translateY(20px);
                transition: transform 0.3s;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            }
            .book-popup-overlay.active .book-popup {
                transform: translateY(0);
            }
            .book-popup-close {
                position: absolute;
                top: 1rem;
                right: 1rem;
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                color: #9CA3AF;
                line-height: 1;
                padding: 0.25rem;
            }
            .book-popup-close:hover {
                color: #1F2937;
            }
            .book-popup-image {
                width: 120px;
                height: auto;
                margin: 0 auto 1rem;
                display: block;
                border-radius: 4px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }
            .book-popup h3 {
                font-size: 1.5rem;
                color: #1F2937;
                margin: 0 0 0.5rem 0;
                font-weight: 700;
            }
            .book-popup .subtitle {
                color: #46AEB8;
                font-size: 1rem;
                margin-bottom: 1rem;
                font-weight: 500;
            }
            .book-popup p {
                color: #6B7280;
                font-size: 0.95rem;
                line-height: 1.6;
                margin-bottom: 1.5rem;
            }
            .book-popup-form {
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
            }
            .book-popup-form input {
                padding: 0.875rem 1rem;
                border: 1px solid #E5E7EB;
                border-radius: 8px;
                font-size: 1rem;
                outline: none;
                transition: border-color 0.2s;
            }
            .book-popup-form input:focus {
                border-color: #46AEB8;
            }
            .book-popup-form button {
                background: #46AEB8;
                color: #FFFFFF;
                border: none;
                padding: 0.875rem 1.5rem;
                border-radius: 8px;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                transition: background 0.2s, transform 0.2s;
            }
            .book-popup-form button:hover {
                background: #3A9AA3;
                transform: translateY(-1px);
            }
            .book-popup-form button:disabled {
                background: #9CA3AF;
                cursor: not-allowed;
                transform: none;
            }
            .book-popup-success {
                text-align: center;
                padding: 1rem 0;
            }
            .book-popup-success svg {
                width: 48px;
                height: 48px;
                color: #46AEB8;
                margin-bottom: 1rem;
            }
            .book-popup-date {
                font-size: 0.85rem;
                color: #9CA3AF;
                margin-top: 1rem;
                text-align: center;
            }
        `;
        document.head.appendChild(popupStyles);

        // Create popup HTML
        const popupOverlay = document.createElement('div');
        popupOverlay.className = 'book-popup-overlay';
        popupOverlay.innerHTML = `
            <div class="book-popup">
                <button class="book-popup-close" aria-label="Close">&times;</button>
                <div class="book-popup-content">
                    <img src="/images/already-gone-cover.png" alt="Already Gone Book Cover" class="book-popup-image" />
                    <h3>Already Gone</h3>
                    <p class="subtitle">78 Ways to Miss Someone Leaving</p>
                    <p>Join the waitlist and get the free PDF: <strong>12 Early Warning Signals Your Employee Is About to Leave</strong></p>
                    <form class="book-popup-form">
                        <input type="text" name="firstName" placeholder="First name" required />
                        <input type="email" name="email" placeholder="Email address" required />
                        <button type="submit">Get the Free PDF</button>
                    </form>
                    <p class="book-popup-date">Launches February 11</p>
                </div>
            </div>
        `;
        document.body.appendChild(popupOverlay);

        // Show popup after 5 seconds
        setTimeout(function() {
            popupOverlay.classList.add('active');
        }, 5000);

        // Close button
        popupOverlay.querySelector('.book-popup-close').addEventListener('click', function() {
            popupOverlay.classList.remove('active');
            localStorage.setItem('book_popup_dismissed', 'true');
        });

        // Close on overlay click
        popupOverlay.addEventListener('click', function(e) {
            if (e.target === popupOverlay) {
                popupOverlay.classList.remove('active');
                localStorage.setItem('book_popup_dismissed', 'true');
            }
        });

        // Form submission
        popupOverlay.querySelector('form').addEventListener('submit', async function(e) {
            e.preventDefault();
            const form = e.target;
            const button = form.querySelector('button');
            const firstName = form.querySelector('input[name="firstName"]').value;
            const email = form.querySelector('input[name="email"]').value;

            button.disabled = true;
            button.textContent = 'Submitting...';

            try {
                const response = await fetch('/api/book-waitlist', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ firstName: firstName, email: email, source: 'popup' })
                });

                if (response.ok) {
                    popupOverlay.querySelector('.book-popup-content').innerHTML = `
                        <div class="book-popup-success">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                            </svg>
                            <h3>Check your inbox</h3>
                            <p>Your free PDF "12 Early Warning Signals" is on its way.</p>
                        </div>
                    `;
                    localStorage.setItem('book_popup_dismissed', 'true');
                    setTimeout(function() {
                        popupOverlay.classList.remove('active');
                    }, 4000);
                } else {
                    throw new Error('Failed');
                }
            } catch (err) {
                button.disabled = false;
                button.textContent = 'Try Again';
            }
        });
    })();

    console.log('Footer loaded successfully');
});
