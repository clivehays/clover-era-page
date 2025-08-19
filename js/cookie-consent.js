// cookie-consent.js - Complete Cookie Management System for Clover ERA

(function() {
    'use strict';

    // Cookie Consent Configuration
    const COOKIE_CONFIG = {
        name: 'clover_cookie_consent',
        expiryDays: 365,
        revision: 1, // Increment this to force re-consent
        categories: {
            essential: {
                name: 'Essential',
                description: 'Required for the website to function properly',
                required: true,
                cookies: ['clover_session', 'clover_cookie_consent']
            },
            analytics: {
                name: 'Analytics',
                description: 'Help us understand how visitors use our website',
                required: false,
                cookies: ['_ga', '_gid', '_gat', '__utma', '__utmb', '__utmc', '__utmz']
            },
            functional: {
                name: 'Functional',
                description: 'Enable enhanced functionality and personalization',
                required: false,
                cookies: ['clover_preferences', 'language', 'timezone']
            },
            marketing: {
                name: 'Marketing',
                description: 'Used to track visitors across websites for marketing',
                required: false,
                cookies: ['_fbp', 'fr', 'li_sugr', 'bcookie', 'lidc', 'UserMatchHistory']
            }
        }
    };

    // Cookie Utility Functions
    const CookieUtil = {
        set: function(name, value, days) {
            const expires = new Date();
            expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
            document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
        },

        get: function(name) {
            const nameEQ = name + "=";
            const ca = document.cookie.split(';');
            for(let i = 0; i < ca.length; i++) {
                let c = ca[i];
                while (c.charAt(0) === ' ') c = c.substring(1, c.length);
                if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
            }
            return null;
        },

        delete: function(name) {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
        },

        deleteByCategory: function(category) {
            const cookies = COOKIE_CONFIG.categories[category]?.cookies || [];
            cookies.forEach(cookie => {
                this.delete(cookie);
                // Also try with different domains
                document.cookie = `${cookie}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=.${window.location.hostname};`;
                document.cookie = `${cookie}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=${window.location.hostname};`;
            });
        }
    };

    // Main Cookie Consent Manager
    const CookieConsent = {
        preferences: {
            essential: true, // Always true
            analytics: false,
            functional: false,
            marketing: false
        },

        init: function() {
            this.loadPreferences();
            this.injectStyles();
            
            // Check if we need to show banner
            const consent = CookieUtil.get(COOKIE_CONFIG.name);
            if (!consent || this.needsReconsent(consent)) {
                this.showBanner();
            } else {
                this.applyPreferences();
            }

            // Add global function for opening preferences
            window.openCookiePreferences = () => this.showPreferences();
        },

        needsReconsent: function(consent) {
            try {
                const data = JSON.parse(consent);
                return data.revision !== COOKIE_CONFIG.revision;
            } catch {
                return true;
            }
        },

        loadPreferences: function() {
            const saved = CookieUtil.get(COOKIE_CONFIG.name);
            if (saved) {
                try {
                    const data = JSON.parse(saved);
                    this.preferences = { ...this.preferences, ...data.preferences };
                } catch (e) {
                    console.error('Error loading cookie preferences:', e);
                }
            }
        },

        savePreferences: function() {
            const data = {
                preferences: this.preferences,
                timestamp: new Date().toISOString(),
                revision: COOKIE_CONFIG.revision
            };
            CookieUtil.set(COOKIE_CONFIG.name, JSON.stringify(data), COOKIE_CONFIG.expiryDays);
            this.applyPreferences();
        },

        applyPreferences: function() {
            // Remove cookies from disabled categories
            Object.keys(COOKIE_CONFIG.categories).forEach(category => {
                if (!this.preferences[category] && category !== 'essential') {
                    CookieUtil.deleteByCategory(category);
                }
            });

            // Fire events for other scripts to listen to
            window.dispatchEvent(new CustomEvent('cookieConsentUpdated', {
                detail: this.preferences
            }));

            // Initialize tracking scripts based on preferences
            this.initializeTracking();
        },

        initializeTracking: function() {
            // Google Analytics
            if (this.preferences.analytics && typeof gtag === 'undefined') {
                const script = document.createElement('script');
                script.async = true;
                script.src = 'https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID';
                document.head.appendChild(script);

                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'GA_MEASUREMENT_ID', {
                    'anonymize_ip': true,
                    'cookie_flags': 'SameSite=Strict;Secure'
                });
            }

            // Facebook Pixel
            if (this.preferences.marketing && typeof fbq === 'undefined') {
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window,document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', 'YOUR_PIXEL_ID');
                fbq('track', 'PageView');
            }

            // Add other tracking scripts as needed
        },

        showBanner: function() {
            const banner = document.createElement('div');
            banner.id = 'cookie-consent-banner';
            banner.className = 'cookie-banner';
            banner.innerHTML = `
                <div class="cookie-banner-content">
                    <div class="cookie-banner-text">
                        <div class="cookie-banner-title">
                            <span class="cookie-icon">🍪</span>
                            We value your privacy
                        </div>
                        <p>We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. By clicking "Accept All", you consent to our use of cookies.</p>
                    </div>
                    <div class="cookie-banner-actions">
                        <button class="cookie-btn cookie-btn-preferences" onclick="CookieConsent.showPreferences()">
                            Manage Preferences
                        </button>
                        <button class="cookie-btn cookie-btn-reject" onclick="CookieConsent.rejectAll()">
                            Reject All
                        </button>
                        <button class="cookie-btn cookie-btn-accept" onclick="CookieConsent.acceptAll()">
                            Accept All
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(banner);

            // Animate in
            setTimeout(() => banner.classList.add('show'), 100);
        },

        hideBanner: function() {
            const banner = document.getElementById('cookie-consent-banner');
            if (banner) {
                banner.classList.remove('show');
                setTimeout(() => banner.remove(), 300);
            }
        },

        showPreferences: function() {
            // Remove banner if showing
            this.hideBanner();

            // Create preferences modal
            const modal = document.createElement('div');
            modal.id = 'cookie-preferences-modal';
            modal.className = 'cookie-modal';
            modal.innerHTML = `
                <div class="cookie-modal-overlay" onclick="CookieConsent.hidePreferences()"></div>
                <div class="cookie-modal-content">
                    <div class="cookie-modal-header">
                        <h2>Cookie Preferences</h2>
                        <button class="cookie-modal-close" onclick="CookieConsent.hidePreferences()">×</button>
                    </div>
                    <div class="cookie-modal-body">
                        <p class="cookie-modal-intro">
                            We use cookies and similar technologies to help personalize content, tailor and measure ads, and provide a better experience. 
                            You can customize your choices below.
                        </p>
                        
                        ${Object.entries(COOKIE_CONFIG.categories).map(([key, category]) => `
                            <div class="cookie-category">
                                <div class="cookie-category-header">
                                    <div class="cookie-category-info">
                                        <h3>${category.name}</h3>
                                        <p>${category.description}</p>
                                    </div>
                                    <label class="cookie-switch ${category.required ? 'disabled' : ''}">
                                        <input type="checkbox" 
                                               id="cookie-${key}" 
                                               ${this.preferences[key] ? 'checked' : ''} 
                                               ${category.required ? 'disabled checked' : ''}
                                               onchange="CookieConsent.updatePreference('${key}', this.checked)">
                                        <span class="cookie-slider"></span>
                                    </label>
                                </div>
                                <div class="cookie-category-cookies">
                                    <small>Cookies: ${category.cookies.join(', ')}</small>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="cookie-modal-footer">
                        <button class="cookie-btn cookie-btn-secondary" onclick="CookieConsent.hidePreferences()">
                            Cancel
                        </button>
                        <button class="cookie-btn cookie-btn-primary" onclick="CookieConsent.saveAndClose()">
                            Save Preferences
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // Animate in
            setTimeout(() => modal.classList.add('show'), 100);
        },

        hidePreferences: function() {
            const modal = document.getElementById('cookie-preferences-modal');
            if (modal) {
                modal.classList.remove('show');
                setTimeout(() => modal.remove(), 300);
            }
        },

        updatePreference: function(category, value) {
            this.preferences[category] = value;
        },

        acceptAll: function() {
            Object.keys(this.preferences).forEach(key => {
                this.preferences[key] = true;
            });
            this.savePreferences();
            this.hideBanner();
            this.showThankYou('Thank you! All cookies have been accepted.');
        },

        rejectAll: function() {
            Object.keys(this.preferences).forEach(key => {
                if (key !== 'essential') {
                    this.preferences[key] = false;
                }
            });
            this.savePreferences();
            this.hideBanner();
            this.showThankYou('Your preferences have been saved. Only essential cookies are active.');
        },

        saveAndClose: function() {
            this.savePreferences();
            this.hidePreferences();
            this.showThankYou('Your cookie preferences have been saved.');
        },

        showThankYou: function(message) {
            const toast = document.createElement('div');
            toast.className = 'cookie-toast';
            toast.textContent = message;
            document.body.appendChild(toast);

            setTimeout(() => toast.classList.add('show'), 100);
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        },

        injectStyles: function() {
            const styles = `
                /* Cookie Banner Styles */
                .cookie-banner {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: white;
                    box-shadow: 0 -5px 20px rgba(0, 0, 0, 0.1);
                    z-index: 10000;
                    transform: translateY(100%);
                    transition: transform 0.3s ease;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .cookie-banner.show {
                    transform: translateY(0);
                }

                .cookie-banner-content {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 2rem;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 2rem;
                }

                .cookie-banner-text {
                    flex: 1;
                }

                .cookie-banner-title {
                    font-size: 1.2rem;
                    font-weight: 600;
                    margin-bottom: 0.5rem;
                    color: #111827;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .cookie-icon {
                    font-size: 1.5rem;
                }

                .cookie-banner-text p {
                    color: #4B5563;
                    line-height: 1.5;
                }

                .cookie-banner-actions {
                    display: flex;
                    gap: 1rem;
                    flex-shrink: 0;
                }

                .cookie-btn {
                    padding: 0.75rem 1.5rem;
                    border-radius: 50px;
                    border: none;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                    font-size: 0.95rem;
                    white-space: nowrap;
                }

                .cookie-btn-accept {
                    background: #FF6B6B;
                    color: white;
                }

                .cookie-btn-accept:hover {
                    background: #ff5252;
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(255, 107, 107, 0.3);
                }

                .cookie-btn-reject {
                    background: #E5E9ED;
                    color: #111827;
                }

                .cookie-btn-reject:hover {
                    background: #d1d5db;
                }

                .cookie-btn-preferences {
                    background: white;
                    color: #46AEB8;
                    border: 2px solid #46AEB8;
                }

                .cookie-btn-preferences:hover {
                    background: #46AEB8;
                    color: white;
                }

                /* Cookie Preferences Modal */
                .cookie-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 10001;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.3s;
                }

                .cookie-modal.show {
                    opacity: 1;
                    visibility: visible;
                }

                .cookie-modal-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                }

                .cookie-modal-content {
                    position: relative;
                    background: white;
                    border-radius: 20px;
                    max-width: 600px;
                    width: 90%;
                    max-height: 80vh;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    transform: scale(0.9);
                    transition: transform 0.3s;
                }

                .cookie-modal.show .cookie-modal-content {
                    transform: scale(1);
                }

                .cookie-modal-header {
                    padding: 2rem;
                    border-bottom: 1px solid #E5E9ED;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .cookie-modal-header h2 {
                    font-size: 1.5rem;
                    color: #111827;
                    margin: 0;
                }

                .cookie-modal-close {
                    background: none;
                    border: none;
                    font-size: 2rem;
                    color: #6B7280;
                    cursor: pointer;
                    padding: 0;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: all 0.3s;
                }

                .cookie-modal-close:hover {
                    background: #F5F7FA;
                    color: #111827;
                }

                .cookie-modal-body {
                    padding: 2rem;
                    overflow-y: auto;
                    flex: 1;
                }

                .cookie-modal-intro {
                    color: #4B5563;
                    margin-bottom: 2rem;
                    line-height: 1.6;
                }

                .cookie-category {
                    background: #F5F7FA;
                    border-radius: 12px;
                    padding: 1.5rem;
                    margin-bottom: 1rem;
                }

                .cookie-category-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.5rem;
                }

                .cookie-category-info h3 {
                    font-size: 1.1rem;
                    color: #111827;
                    margin-bottom: 0.25rem;
                }

                .cookie-category-info p {
                    color: #4B5563;
                    font-size: 0.9rem;
                }

                .cookie-category-cookies {
                    color: #6B7280;
                    font-size: 0.85rem;
                    margin-top: 0.5rem;
                }

                /* Cookie Toggle Switch */
                .cookie-switch {
                    position: relative;
                    display: inline-block;
                    width: 50px;
                    height: 26px;
                }

                .cookie-switch input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }

                .cookie-slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: #E5E9ED;
                    transition: 0.4s;
                    border-radius: 34px;
                }

                .cookie-slider:before {
                    position: absolute;
                    content: "";
                    height: 20px;
                    width: 20px;
                    left: 3px;
                    bottom: 3px;
                    background-color: white;
                    transition: 0.4s;
                    border-radius: 50%;
                }

                .cookie-switch input:checked + .cookie-slider {
                    background-color: #46AEB8;
                }

                .cookie-switch input:checked + .cookie-slider:before {
                    transform: translateX(24px);
                }

                .cookie-switch.disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .cookie-switch.disabled .cookie-slider {
                    cursor: not-allowed;
                }

                .cookie-modal-footer {
                    padding: 2rem;
                    border-top: 1px solid #E5E9ED;
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                }

                .cookie-btn-secondary {
                    background: #E5E9ED;
                    color: #111827;
                }

                .cookie-btn-secondary:hover {
                    background: #d1d5db;
                }

                .cookie-btn-primary {
                    background: #46AEB8;
                    color: white;
                }

                .cookie-btn-primary:hover {
                    background: #3A8F98;
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(70, 174, 184, 0.3);
                }

                /* Toast Notification */
                .cookie-toast {
                    position: fixed;
                    bottom: 2rem;
                    left: 50%;
                    transform: translateX(-50%) translateY(100px);
                    background: #111827;
                    color: white;
                    padding: 1rem 2rem;
                    border-radius: 50px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                    z-index: 10002;
                    opacity: 0;
                    transition: all 0.3s;
                }

                .cookie-toast.show {
                    transform: translateX(-50%) translateY(0);
                    opacity: 1;
                }

                /* Mobile Responsive */
                @media (max-width: 768px) {
                    .cookie-banner-content {
                        flex-direction: column;
                        text-align: center;
                    }

                    .cookie-banner-actions {
                        width: 100%;
                        flex-direction: column;
                    }

                    .cookie-btn {
                        width: 100%;
                    }

                    .cookie-modal-content {
                        width: 95%;
                        max-height: 90vh;
                        margin: 1rem;
                    }

                    .cookie-category-header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 1rem;
                    }

                    .cookie-switch {
                        align-self: flex-end;
                    }
                }
            `;

            const styleSheet = document.createElement('style');
            styleSheet.textContent = styles;
            document.head.appendChild(styleSheet);
        }
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => CookieConsent.init());
    } else {
        CookieConsent.init();
    }

    // Make CookieConsent globally available
    window.CookieConsent = CookieConsent;
})();
