const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://cloverera.com';

const results = {
    pages: [],
    brokenLinks: [],
    brokenImages: [],
    missingMeta: [],
    redirectsWorking: [],
    redirectsFailing: [],
    scriptsLoading: [],
    scriptsFailing: []
};

// Static pages to audit
const STATIC_PAGES = [
    '/',
    '/pricing/',
    '/how-it-works.html',
    '/about.html',
    '/contact.html',
    '/calculator/',
    '/research/',
    '/Blog/',
    '/why-employees-leave/',
    '/turnover-after-restructure/',
    '/manager-turnover-problem/',
    '/clover-framework.html',
    '/our-science.html',
    '/case-studies/',
    '/neuroscience-of-employee-engagement/',
    '/book/',
    '/reduce-employee-turnover/',
    '/reduce-employee-turnover.html',
    '/quiet-cracking/',
    '/roundtable/',
    '/talk.html'
];

// Redirects from vercel.json to test
const REDIRECTS_TO_TEST = [
    // Location redirects
    { from: '/locations/', to: '/', status: 301 },
    { from: '/locations/Belfast/', to: '/', status: 301 },
    { from: '/locations/Birmingham/', to: '/', status: 301 },
    { from: '/locations/Bristol/', to: '/', status: 301 },
    { from: '/locations/Cardiff/', to: '/', status: 301 },
    { from: '/locations/Dublin/', to: '/', status: 301 },
    { from: '/locations/Edinburgh/', to: '/', status: 301 },
    { from: '/locations/Glasgow/', to: '/', status: 301 },
    { from: '/locations/Leeds/', to: '/', status: 301 },
    { from: '/locations/Leicester/', to: '/', status: 301 },
    { from: '/locations/Liverpool/', to: '/', status: 301 },
    { from: '/locations/Manchester/', to: '/', status: 301 },
    { from: '/locations/Newcastle/', to: '/', status: 301 },
    { from: '/locations/Nottingham/', to: '/', status: 301 },
    { from: '/locations/Sheffield/', to: '/', status: 301 },

    // Workplace solutions redirects
    { from: '/workplace-solutions/Employee-burnout-solutions.html', to: '/burnout/', status: 301 },
    { from: '/workplace-solutions/toxic-management-solutions.html', to: '/toxic-management/', status: 301 },
    { from: '/workplace-solutions/retention-crisis-solutions.html', to: '/why-employees-leave/', status: 301 },
    { from: '/workplace-solutions/workplace-anxiety-solutions.html', to: '/workplace-anxiety/', status: 301 },
    { from: '/workplace-solutions/communication-breakdown-solutions.html', to: '/burnout/', status: 301 },
    { from: '/workplace-solutions/career-stagnation-solutions.html', to: '/why-employees-leave/', status: 301 },
    { from: '/workplace-solutions/workload-imbalance-solutions.html', to: '/burnout/', status: 301 },
    { from: '/workplace-solutions/recognition-deficit-solutions.html', to: '/why-employees-leave/', status: 301 },
    { from: '/workplace-solutions/trust-erosion-solutions.html', to: '/toxic-management/', status: 301 },
    { from: '/workplace-solutions/change-fatigue-solutions.html', to: '/turnover-after-restructure/', status: 301 },
    { from: '/workplace-solutions/team-conflict-solutions.html', to: '/toxic-management/', status: 301 },
    { from: '/workplace-solutions/unclear-expectations-solutions.html', to: '/manager-turnover-problem/', status: 301 },
    { from: '/workplace-solutions/feedback-void-solutions.html', to: '/manager-turnover-problem/', status: 301 },
    { from: '/workplace-solutions/autonomy-suppression-solutions.html', to: '/why-employees-leave/', status: 301 },
    { from: '/workplace-solutions/psychological-safety-solutions.html', to: '/toxic-management/', status: 301 },
    { from: '/workplace-solutions/', to: '/how-it-works.html', status: 301 },

    // Other redirects
    { from: '/active-employee-engagement-management/', to: '/', status: 301 },
    { from: '/what-is-employee-engagement/', to: '/our-science.html', status: 301 },
    { from: '/early-adopter-program.html', to: '/pricing/', status: 301 },
    { from: '/pilot/', to: '/pricing/', status: 301 },
    { from: '/30-day-free-pilot/', to: '/pricing/', status: 301 },
    { from: '/the-brain-chemistry-audit/', to: '/our-science.html', status: 301 },
    { from: '/the-quiet-crack/', to: '/quiet-cracking/', status: 301 },
    { from: '/3-min-manager-fix/', to: '/how-it-works.html', status: 301 },
    { from: '/tech-ceo-guide/', to: '/', status: 301 },
    { from: '/employee-engagement-platform/', to: '/how-it-works.html', status: 301 },
    { from: '/employee-engagement-software/', to: '/how-it-works.html', status: 301 },
    { from: '/employee-retention-strategies/', to: '/reduce-employee-turnover.html', status: 301 },
    { from: '/employee-turnover-solutions/', to: '/reduce-employee-turnover.html', status: 301 },
    { from: '/improve-employee-retention/', to: '/reduce-employee-turnover.html', status: 301 },
    { from: '/reduce-staff-turnover/', to: '/reduce-employee-turnover.html', status: 301 },
    { from: '/quiet-quitting/', to: '/quiet-cracking/', status: 301 },
    { from: '/quiet-quitting-solutions/', to: '/quiet-cracking/', status: 301 },

    // Research redirects
    { from: '/research/clover-framework-neuroscience.html', to: '/clover-framework.html', status: 301 },
    { from: '/research/daily-checkins-vs-annual-surveys.html', to: '/our-science.html', status: 301 },
    { from: '/research/uk-employee-engagement-statistics.html', to: '/calculator/', status: 301 },
    { from: '/research/2026-employee-experience-reality.html', to: '/why-employees-leave/', status: 301 }
];

async function checkUrl(url) {
    return new Promise((resolve) => {
        const protocol = url.startsWith('https') ? https : http;
        const req = protocol.get(url, { timeout: 10000 }, (res) => {
            resolve({
                status: res.statusCode,
                location: res.headers.location,
                ok: res.statusCode >= 200 && res.statusCode < 400
            });
        });
        req.on('error', (err) => resolve({ status: 0, error: err.message, ok: false }));
        req.on('timeout', () => {
            req.destroy();
            resolve({ status: 0, error: 'timeout', ok: false });
        });
    });
}

async function fetchPage(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { timeout: 15000 }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                // Follow redirect
                const redirectUrl = res.headers.location.startsWith('http')
                    ? res.headers.location
                    : BASE_URL + res.headers.location;
                fetchPage(redirectUrl).then(resolve).catch(reject);
                return;
            }

            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, html: data }));
        }).on('error', reject);
    });
}

async function auditPage(pagePath) {
    const url = BASE_URL + pagePath;
    console.log(`Auditing: ${url}`);

    try {
        const response = await fetchPage(url);
        if (response.status >= 400) {
            results.pages.push({ path: pagePath, status: 'FAILED', code: response.status });
            return;
        }

        const html = response.html;

        // Simple HTML parsing for meta tags
        const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : null;

        const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
                         html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);
        const description = descMatch ? descMatch[1] : null;

        if (!title || !description) {
            results.missingMeta.push({ path: pagePath, title: !!title, description: !!description });
        }

        // Extract internal links
        const linkRegex = /href=["']([^"']*?)["']/gi;
        let match;
        const checkedLinks = new Set();

        while ((match = linkRegex.exec(html)) !== null) {
            const href = match[1];
            if ((href.startsWith('/') || href.startsWith(BASE_URL)) && !checkedLinks.has(href)) {
                checkedLinks.add(href);
                const fullUrl = href.startsWith('/') ? BASE_URL + href : href;

                // Skip external links and anchors
                if (fullUrl.startsWith(BASE_URL) && !href.startsWith('#')) {
                    const check = await checkUrl(fullUrl);
                    if (!check.ok && check.status !== 301 && check.status !== 302 && check.status !== 308) {
                        results.brokenLinks.push({ page: pagePath, link: href, status: check.status });
                    }
                }
            }
        }

        // Extract images
        const imgRegex = /src=["']([^"']*?)["']/gi;
        const checkedImages = new Set();

        while ((match = imgRegex.exec(html)) !== null) {
            const src = match[1];
            if ((src.startsWith('/') || src.startsWith(BASE_URL)) && !checkedImages.has(src)) {
                checkedImages.add(src);
                if (src.match(/\.(jpg|jpeg|png|gif|svg|webp|ico)(\?.*)?$/i)) {
                    const fullUrl = src.startsWith('/') ? BASE_URL + src : src;
                    const check = await checkUrl(fullUrl);
                    if (!check.ok) {
                        results.brokenImages.push({ page: pagePath, image: src, status: check.status });
                    }
                }
            }
        }

        // Extract scripts
        const scriptRegex = /<script[^>]*src=["']([^"']*?)["']/gi;

        while ((match = scriptRegex.exec(html)) !== null) {
            const src = match[1];
            if (src.startsWith('/')) {
                const fullUrl = BASE_URL + src;
                const check = await checkUrl(fullUrl);
                if (check.ok) {
                    results.scriptsLoading.push({ page: pagePath, script: src });
                } else {
                    results.scriptsFailing.push({ page: pagePath, script: src, status: check.status });
                }
            }
        }

        results.pages.push({ path: pagePath, status: 'OK', title, hasDescription: !!description });

    } catch (err) {
        results.pages.push({ path: pagePath, status: 'ERROR', error: err.message });
    }
}

async function testRedirects() {
    console.log('\nTesting redirects...');
    for (const redirect of REDIRECTS_TO_TEST) {
        const url = BASE_URL + redirect.from;
        const check = await checkUrl(url);

        // Check if we got a redirect status (301, 302, 307, 308)
        const isRedirect = check.status >= 300 && check.status < 400;

        if (isRedirect) {
            results.redirectsWorking.push({ ...redirect, actualStatus: check.status, actualLocation: check.location });
        } else {
            results.redirectsFailing.push({
                ...redirect,
                actualStatus: check.status,
                actualLocation: check.location
            });
        }
    }
}

async function runAudit() {
    console.log('Starting website audit...\n');
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`Static pages to check: ${STATIC_PAGES.length}`);
    console.log(`Redirects to test: ${REDIRECTS_TO_TEST.length}\n`);

    // Audit all static pages
    for (const page of STATIC_PAGES) {
        await auditPage(page);
    }

    // Test redirects
    await testRedirects();

    // Output results
    console.log('\n========== AUDIT RESULTS ==========\n');

    console.log(`Pages checked: ${results.pages.length}`);
    console.log(`  - OK: ${results.pages.filter(p => p.status === 'OK').length}`);
    console.log(`  - Failed: ${results.pages.filter(p => p.status === 'FAILED').length}`);
    console.log(`  - Error: ${results.pages.filter(p => p.status === 'ERROR').length}`);

    if (results.pages.filter(p => p.status !== 'OK').length > 0) {
        console.log('\n PAGES WITH ISSUES:');
        results.pages.filter(p => p.status !== 'OK').forEach(p => {
            console.log(`  ${p.path} - ${p.status} ${p.code || p.error || ''}`);
        });
    }

    if (results.brokenLinks.length > 0) {
        console.log('\n BROKEN LINKS:');
        results.brokenLinks.forEach(bl => {
            console.log(`  ${bl.page} -> ${bl.link} (${bl.status})`);
        });
    } else {
        console.log('\n No broken links found');
    }

    if (results.brokenImages.length > 0) {
        console.log('\n BROKEN IMAGES:');
        results.brokenImages.forEach(bi => {
            console.log(`  ${bi.page} -> ${bi.image} (${bi.status})`);
        });
    } else {
        console.log('\n No broken images found');
    }

    if (results.missingMeta.length > 0) {
        console.log('\n MISSING META:');
        results.missingMeta.forEach(mm => {
            console.log(`  ${mm.path} - title: ${mm.title ? 'OK' : 'MISSING'}, description: ${mm.description ? 'OK' : 'MISSING'}`);
        });
    } else {
        console.log('\n All pages have meta tags');
    }

    if (results.scriptsFailing.length > 0) {
        console.log('\n FAILING SCRIPTS:');
        results.scriptsFailing.forEach(sf => {
            console.log(`  ${sf.page} -> ${sf.script} (${sf.status})`);
        });
    } else {
        console.log('\n All scripts loading correctly');
    }

    console.log(`\nRedirects working: ${results.redirectsWorking.length}`);
    console.log(`Redirects failing: ${results.redirectsFailing.length}`);

    if (results.redirectsFailing.length > 0) {
        console.log('\n FAILING REDIRECTS:');
        results.redirectsFailing.forEach(rf => {
            console.log(`  ${rf.from} -> expected redirect, got ${rf.actualStatus}`);
        });
    }

    // Write full results to file
    fs.writeFileSync('audit-results.json', JSON.stringify(results, null, 2));
    console.log('\nFull results written to audit-results.json');

    // Summary
    console.log('\n========== SUMMARY ==========');
    const issues = results.brokenLinks.length + results.brokenImages.length +
                   results.missingMeta.length + results.scriptsFailing.length +
                   results.redirectsFailing.length +
                   results.pages.filter(p => p.status !== 'OK').length;

    if (issues === 0) {
        console.log(' All checks passed!');
    } else {
        console.log(` ${issues} issue(s) found - review above for details`);
    }
}

runAudit().catch(console.error);
