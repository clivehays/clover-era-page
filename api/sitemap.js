import { createClient } from '@supabase/supabase-js';

// Core site pages only - clean sitemap for Google/Bing
const staticPages = [
  // Core site
  { loc: 'https://cloverera.com/', changefreq: 'weekly', priority: '1.0' },
  { loc: 'https://cloverera.com/how-it-works/', changefreq: 'monthly', priority: '0.9' },
  { loc: 'https://cloverera.com/pricing/', changefreq: 'monthly', priority: '0.9' },
  { loc: 'https://cloverera.com/get/', changefreq: 'monthly', priority: '0.9' },
  { loc: 'https://cloverera.com/about/', changefreq: 'monthly', priority: '0.8' },
  { loc: 'https://cloverera.com/talk/', changefreq: 'monthly', priority: '0.8' },
  { loc: 'https://cloverera.com/assessment/', changefreq: 'monthly', priority: '0.8' },
  { loc: 'https://cloverera.com/calculator/', changefreq: 'monthly', priority: '0.8' },
  { loc: 'https://cloverera.com/clover-framework/', changefreq: 'monthly', priority: '0.8' },
  { loc: 'https://cloverera.com/book/', changefreq: 'monthly', priority: '0.7' },
  { loc: 'https://cloverera.com/alreadygone/', changefreq: 'monthly', priority: '0.7' },

  // Blog index
  { loc: 'https://cloverera.com/Blog/', changefreq: 'weekly', priority: '0.7' },

  // Why people leave content
  { loc: 'https://cloverera.com/why-employees-leave/', changefreq: 'monthly', priority: '0.7' },
  { loc: 'https://cloverera.com/turnover-after-restructure/', changefreq: 'monthly', priority: '0.7' },
  { loc: 'https://cloverera.com/manager-turnover-problem/', changefreq: 'monthly', priority: '0.7' },
  { loc: 'https://cloverera.com/reduce-employee-turnover/', changefreq: 'monthly', priority: '0.7' },

  // Legal
  { loc: 'https://cloverera.com/privacy-policy.html', changefreq: 'yearly', priority: '0.3' },
  { loc: 'https://cloverera.com/terms.html', changefreq: 'yearly', priority: '0.3' },
  { loc: 'https://cloverera.com/cookie-policy.html', changefreq: 'yearly', priority: '0.3' },
];

function formatDate(date) {
  return new Date(date).toISOString().split('T')[0];
}

function generateUrlEntry(page, lastmod = null) {
  const today = formatDate(new Date());
  return `
    <url>
        <loc>${page.loc}</loc>
        <lastmod>${lastmod || today}</lastmod>
        <changefreq>${page.changefreq}</changefreq>
        <priority>${page.priority}</priority>
    </url>`;
}

export default async function handler(req, res) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

    let posts = null;

    // Fetch blog posts from Supabase if configured
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase
        .from('blog_articles')
        .select('slug, updated_at')
        .eq('status', 'published')
        .order('updated_at', { ascending: false });

      if (!error) {
        posts = data;
      }
    }

    // Generate XML for static pages
    const staticUrls = staticPages.map(page => generateUrlEntry(page)).join('');

    // Generate XML for blog posts
    let blogUrls = '';
    if (posts && posts.length > 0) {
      blogUrls = posts.map(post => {
        return generateUrlEntry(
          {
            loc: `https://cloverera.com/Blog/${post.slug}.html`,
            changefreq: 'monthly',
            priority: '0.6'
          },
          formatDate(post.updated_at)
        );
      }).join('');
    }

    // Combine into full sitemap
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${staticUrls}${blogUrls}
</urlset>`;

    // Set headers
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

    res.status(200).send(sitemap);
  } catch (err) {
    console.error('Sitemap generation error:', err);
    res.status(500).send('Error generating sitemap');
  }
}
