import { createClient } from '@supabase/supabase-js';

// Static pages that don't change
const staticPages = [
  { loc: 'https://cloverera.com/', changefreq: 'weekly', priority: '1.0' },
  { loc: 'https://cloverera.com/pricing/', changefreq: 'monthly', priority: '0.9' },
  { loc: 'https://cloverera.com/how-it-works.html', changefreq: 'monthly', priority: '0.9' },
  { loc: 'https://cloverera.com/why-employees-leave/', changefreq: 'monthly', priority: '0.9' },
  { loc: 'https://cloverera.com/turnover-after-restructure/', changefreq: 'monthly', priority: '0.9' },
  { loc: 'https://cloverera.com/manager-turnover-problem/', changefreq: 'monthly', priority: '0.9' },
  { loc: 'https://cloverera.com/reduce-employee-turnover/', changefreq: 'monthly', priority: '0.9' },
  { loc: 'https://cloverera.com/calculator/', changefreq: 'monthly', priority: '0.8' },
  { loc: 'https://cloverera.com/clover-framework.html', changefreq: 'monthly', priority: '0.8' },
  { loc: 'https://cloverera.com/about.html', changefreq: 'monthly', priority: '0.7' },
  { loc: 'https://cloverera.com/research/', changefreq: 'monthly', priority: '0.7' },
  { loc: 'https://cloverera.com/our-science.html', changefreq: 'monthly', priority: '0.7' },
  { loc: 'https://cloverera.com/case-studies/', changefreq: 'monthly', priority: '0.7' },
  { loc: 'https://cloverera.com/neuroscience-of-employee-engagement/', changefreq: 'monthly', priority: '0.7' },
  { loc: 'https://cloverera.com/book/', changefreq: 'monthly', priority: '0.7' },
  { loc: 'https://cloverera.com/talk.html', changefreq: 'monthly', priority: '0.7' },
  { loc: 'https://cloverera.com/contact.html', changefreq: 'monthly', priority: '0.6' },
  { loc: 'https://cloverera.com/Blog/', changefreq: 'weekly', priority: '0.6' },
  { loc: 'https://cloverera.com/roundtable/', changefreq: 'monthly', priority: '0.6' },
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
    // Create Supabase client inside handler to ensure env vars are available
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    let posts = null;
    let error = null;

    // Only attempt Supabase connection if env vars are set
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const result = await supabase
        .from('blog_posts')
        .select('slug, updated_at')
        .eq('published', true)
        .order('updated_at', { ascending: false });

      posts = result.data;
      error = result.error;

      if (error) {
        console.error('Supabase error:', error);
        // Continue with static pages only if Supabase fails
      }
    } else {
      console.log('Supabase env vars not configured, returning static pages only');
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
