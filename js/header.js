// header.js
document.addEventListener('DOMContentLoaded', function() {
    const headerHTML = `
    <!-- Navigation -->
    <nav aria-label="Main navigation">
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
    </nav>`;

    // Insert header at the beginning of body
    document.body.insertAdjacentHTML('afterbegin', headerHTML);

    // Initialize mobile menu
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

        document.addEventListener('click', function(e) {
            if (!navLinks.contains(e.target) && !mobileToggle.contains(e.target)) {
                navLinks.classList.remove('active');
                mobileToggle.classList.remove('active');
                mobileToggle.setAttribute('aria-expanded', 'false');
            }
        });

        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                mobileToggle.classList.remove('active');
                mobileToggle.setAttribute('aria-expanded', 'false');
            });
        });
    }
});
