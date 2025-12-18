// Breadcrumb configuration - defines site hierarchy
const BREADCRUMB_CONFIG = {
    '/': { name: 'Home', parent: null },
    '/index.html': { name: 'Home', parent: null },
    '/pricing/': { name: 'Pricing', parent: '/' },
    '/how-it-works.html': { name: 'How It Works', parent: '/' },
    '/about.html': { name: 'About', parent: '/' },
    '/contact.html': { name: 'Contact', parent: '/' },
    '/calculator/': { name: 'Turnover Calculator', parent: '/' },
    '/research/': { name: 'Research', parent: '/' },
    '/Blog/': { name: 'Blog', parent: '/' },
    '/book/': { name: 'Book', parent: '/' },

    // Pillar pages
    '/why-employees-leave/': { name: 'Why Employees Leave', parent: '/' },
    '/turnover-after-restructure/': { name: 'Turnover After Restructure', parent: '/' },
    '/manager-turnover-problem/': { name: 'Manager Turnover Problem', parent: '/' },
    '/reduce-employee-turnover/': { name: 'Reduce Employee Turnover', parent: '/' },
    '/reduce-employee-turnover.html': { name: 'Reduce Employee Turnover', parent: '/' },

    // Cluster pages (under pillars)
    '/clover-framework.html': { name: 'CLOVER Framework', parent: '/manager-turnover-problem/' },
    '/our-science.html': { name: 'Our Science', parent: '/' },
    '/case-studies/': { name: 'Case Studies', parent: '/' },
    '/neuroscience-of-employee-engagement/': { name: 'Neuroscience of Employee Engagement', parent: '/research/' },
    '/quiet-cracking/': { name: 'Quiet Cracking', parent: '/why-employees-leave/' },

    // Additional pages
    '/roundtable/': { name: 'Manager Roundtable', parent: '/' },
    '/roundtable/apply/': { name: 'Apply', parent: '/roundtable/' },
    '/roundtable/thank-you/': { name: 'Thank You', parent: '/roundtable/' },
    '/talk.html': { name: 'Connect', parent: '/' },
    '/privacy-policy.html': { name: 'Privacy Policy', parent: '/' },
    '/terms.html': { name: 'Terms of Service', parent: '/' }
};

function getBreadcrumbPath(currentPath) {
    const path = [];
    let current = currentPath;

    // Handle dynamic blog post URLs: /Blog/[slug]/
    if (current.startsWith('/Blog/') && current !== '/Blog/') {
        // Get the page title from the document
        const pageTitle = document.querySelector('h1')?.textContent ||
                          document.querySelector('title')?.textContent?.split('|')[0]?.trim() ||
                          'Blog Post';

        // Add the blog post as current page
        path.unshift({
            url: current,
            name: pageTitle
        });

        // Then add Blog index as parent
        path.unshift({
            url: '/Blog/',
            name: 'Blog'
        });

        // Then add Home
        path.unshift({
            url: '/',
            name: 'Home'
        });

        return path;
    }

    // Handle static pages from config
    while (current && BREADCRUMB_CONFIG[current]) {
        path.unshift({
            url: current,
            name: BREADCRUMB_CONFIG[current].name
        });
        current = BREADCRUMB_CONFIG[current].parent;
    }

    return path;
}

function generateBreadcrumbHTML(path, currentPath) {
    if (path.length <= 1) return ''; // Don't show breadcrumbs on homepage

    const items = path.map((item, index) => {
        const isLast = index === path.length - 1;
        if (isLast) {
            return `<li class="breadcrumb-item"><span class="breadcrumb-current">${item.name}</span></li>`;
        }
        return `<li class="breadcrumb-item"><a href="${item.url}" class="breadcrumb-link">${item.name}</a></li>`;
    }).join('');

    return `
        <nav class="breadcrumbs" aria-label="Breadcrumb">
            <div class="breadcrumbs-container">
                <ol class="breadcrumb-list">
                    ${items}
                </ol>
            </div>
        </nav>
    `;
}

function generateBreadcrumbSchema(path) {
    if (path.length <= 1) return null;

    const itemListElement = path.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": item.name,
        "item": `https://cloverera.com${item.url}`
    }));

    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": itemListElement
    };
}

function insertBreadcrumbs() {
    // Get current path
    let currentPath = window.location.pathname;

    // Normalize path (ensure trailing slash for directories)
    if (!currentPath.endsWith('/') && !currentPath.endsWith('.html')) {
        currentPath += '/';
    }

    const path = getBreadcrumbPath(currentPath);

    if (path.length <= 1) return; // No breadcrumbs for homepage

    // Generate and insert HTML
    const breadcrumbHTML = generateBreadcrumbHTML(path, currentPath);

    // Find the main nav or header to insert after
    const mainNav = document.querySelector('nav.main-nav');
    if (mainNav) {
        mainNav.insertAdjacentHTML('afterend', breadcrumbHTML);
    } else {
        // Fallback: insert at the beginning of body after any nav
        const existingNav = document.querySelector('nav');
        if (existingNav) {
            existingNav.insertAdjacentHTML('afterend', breadcrumbHTML);
        } else {
            document.body.insertAdjacentHTML('afterbegin', breadcrumbHTML);
        }
    }

    // Generate and insert schema
    const schema = generateBreadcrumbSchema(path);
    if (schema) {
        const schemaScript = document.createElement('script');
        schemaScript.type = 'application/ld+json';
        schemaScript.textContent = JSON.stringify(schema);
        document.head.appendChild(schemaScript);
    }
}

// Run on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', insertBreadcrumbs);
} else {
    insertBreadcrumbs();
}
