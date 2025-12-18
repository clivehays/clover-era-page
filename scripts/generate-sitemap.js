const fs = require('fs');

const BASE_URL = 'https://cloverera.com';

// Supabase configuration (use environment variables in production)
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

// Only create Supabase client if credentials are provided
let supabase = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Static pages with their metadata
const STATIC_PAGES = [
    // Core pages
    { url: '/', priority: 1.0, changefreq: 'weekly' },
    { url: '/pricing/', priority: 0.9, changefreq: 'monthly' },
    { url: '/how-it-works.html', priority: 0.9, changefreq: 'monthly' },
    { url: '/about.html', priority: 0.7, changefreq: 'monthly' },
    { url: '/contact.html', priority: 0.6, changefreq: 'monthly' },
    { url: '/calculator/', priority: 0.8, changefreq: 'monthly' },

    // Pillar pages (high priority for SEO)
    { url: '/why-employees-leave/', priority: 0.9, changefreq: 'monthly' },
    { url: '/turnover-after-restructure/', priority: 0.9, changefreq: 'monthly' },
    { url: '/manager-turnover-problem/', priority: 0.9, changefreq: 'monthly' },
    { url: '/reduce-employee-turnover/', priority: 0.9, changefreq: 'monthly' },

    // Supporting pages
    { url: '/research/', priority: 0.7, changefreq: 'monthly' },
    { url: '/clover-framework.html', priority: 0.8, changefreq: 'monthly' },
    { url: '/our-science.html', priority: 0.7, changefreq: 'monthly' },
    { url: '/case-studies/', priority: 0.7, changefreq: 'monthly' },
    { url: '/neuroscience-of-employee-engagement/', priority: 0.7, changefreq: 'monthly' },
    { url: '/quiet-cracking/', priority: 0.7, changefreq: 'monthly' },

    // Book pages
    { url: '/book/', priority: 0.7, changefreq: 'monthly' },

    // Blog index
    { url: '/Blog/', priority: 0.6, changefreq: 'weekly' },

    // Roundtable
    { url: '/roundtable/', priority: 0.6, changefreq: 'monthly' },

    // Legal pages
    { url: '/privacy-policy.html', priority: 0.3, changefreq: 'yearly' },
    { url: '/terms.html', priority: 0.3, changefreq: 'yearly' },
    { url: '/cookie-policy.html', priority: 0.3, changefreq: 'yearly' },
];

// Function to get today's date in YYYY-MM-DD format
function getToday() {
    return new Date().toISOString().split('T')[0];
}

// Function to format date from Supabase
function formatDate(dateString) {
    if (!dateString) return getToday();
    return new Date(dateString).toISOString().split('T')[0];
}

// Fetch blog posts from Supabase
async function fetchBlogPosts() {
    if (!supabase) {
        return [];
    }

    try {
        const { data, error } = await supabase
            .from('blog_posts')  // Adjust table name if different
            .select('slug, updated_at, published_at')
            .eq('published', true)  // Only published posts
            .order('published_at', { ascending: false });

        if (error) {
            console.error('Error fetching blog posts:', error);
            return [];
        }

        return data.map(post => ({
            url: `/Blog/${post.slug}/`,
            priority: 0.6,
            changefreq: 'monthly',
            lastmod: formatDate(post.updated_at || post.published_at)
        }));
    } catch (err) {
        console.error('Failed to fetch blog posts:', err);
        return [];
    }
}

function generateSitemap(pages) {
    const today = getToday();

    const urlEntries = pages.map(page => `
    <url>
        <loc>${BASE_URL}${page.url}</loc>
        <lastmod>${page.lastmod || today}</lastmod>
        <changefreq>${page.changefreq}</changefreq>
        <priority>${page.priority}</priority>
    </url>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

async function main() {
    console.log('Fetching blog posts from Supabase...');

    let blogPosts = [];

    // Only try to fetch from Supabase if credentials are configured
    if (supabase) {
        blogPosts = await fetchBlogPosts();
        console.log(`Found ${blogPosts.length} published blog posts`);
    } else {
        console.log('Supabase not configured - generating sitemap with static pages only');
        console.log('To include blog posts, set SUPABASE_URL and SUPABASE_ANON_KEY environment variables');
    }

    // Combine static pages with blog posts
    const allPages = [...STATIC_PAGES, ...blogPosts];

    // Generate sitemap
    const sitemap = generateSitemap(allPages);

    // Write to file
    fs.writeFileSync('sitemap.xml', sitemap);
    console.log('Sitemap generated: sitemap.xml');
    console.log(`Total URLs: ${allPages.length} (${STATIC_PAGES.length} static + ${blogPosts.length} blog posts)`);

    // Also generate a simple text sitemap for reference
    const textSitemap = allPages.map(p => BASE_URL + p.url).join('\n');
    fs.writeFileSync('sitemap.txt', textSitemap);
    console.log('Text sitemap generated: sitemap.txt');

    // Log blog posts for verification
    if (blogPosts.length > 0) {
        console.log('\nBlog posts included:');
        blogPosts.forEach(post => console.log(`  ${post.url}`));
    }
}

main().catch(console.error);
