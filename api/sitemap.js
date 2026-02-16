import { createClient } from '@supabase/supabase-js';

// Static pages - canonical URLs only (no old .html duplicates)
const staticPages = [
  // Core pages
  { loc: 'https://cloverera.com/', changefreq: 'weekly', priority: '1.0' },
  { loc: 'https://cloverera.com/how-it-works/', changefreq: 'monthly', priority: '0.9' },
  { loc: 'https://cloverera.com/pricing/', changefreq: 'monthly', priority: '0.9' },
  { loc: 'https://cloverera.com/get/', changefreq: 'monthly', priority: '0.9' },
  { loc: 'https://cloverera.com/about/', changefreq: 'monthly', priority: '0.8' },
  { loc: 'https://cloverera.com/talk/', changefreq: 'monthly', priority: '0.8' },
  { loc: 'https://cloverera.com/assessment/', changefreq: 'monthly', priority: '0.8' },
  { loc: 'https://cloverera.com/calculator/', changefreq: 'monthly', priority: '0.8' },
  { loc: 'https://cloverera.com/clover-framework/', changefreq: 'monthly', priority: '0.8' },
  { loc: 'https://cloverera.com/signal/', changefreq: 'monthly', priority: '0.7' },

  // Books
  { loc: 'https://cloverera.com/book/', changefreq: 'monthly', priority: '0.7' },
  { loc: 'https://cloverera.com/alreadygone/', changefreq: 'monthly', priority: '0.7' },

  // Blog index
  { loc: 'https://cloverera.com/Blog/', changefreq: 'weekly', priority: '0.7' },

  // SEO content pages
  { loc: 'https://cloverera.com/why-employees-leave/', changefreq: 'monthly', priority: '0.7' },
  { loc: 'https://cloverera.com/turnover-after-restructure/', changefreq: 'monthly', priority: '0.7' },
  { loc: 'https://cloverera.com/manager-turnover-problem/', changefreq: 'monthly', priority: '0.7' },
  { loc: 'https://cloverera.com/reduce-employee-turnover/', changefreq: 'monthly', priority: '0.7' },
  { loc: 'https://cloverera.com/neuroscience-of-employee-engagement/', changefreq: 'monthly', priority: '0.7' },
  { loc: 'https://cloverera.com/burnout/', changefreq: 'monthly', priority: '0.6' },
  { loc: 'https://cloverera.com/change-fatigue/', changefreq: 'monthly', priority: '0.6' },
  { loc: 'https://cloverera.com/culture-breakdown/', changefreq: 'monthly', priority: '0.6' },
  { loc: 'https://cloverera.com/employee-stress/', changefreq: 'monthly', priority: '0.6' },
  { loc: 'https://cloverera.com/hybrid-working-issues/', changefreq: 'monthly', priority: '0.6' },
  { loc: 'https://cloverera.com/productivity-loss/', changefreq: 'monthly', priority: '0.6' },
  { loc: 'https://cloverera.com/quiet-cracking/', changefreq: 'monthly', priority: '0.6' },
  { loc: 'https://cloverera.com/retention-crisis/', changefreq: 'monthly', priority: '0.6' },
  { loc: 'https://cloverera.com/toxic-management/', changefreq: 'monthly', priority: '0.6' },
  { loc: 'https://cloverera.com/workplace-anxiety/', changefreq: 'monthly', priority: '0.6' },
  { loc: 'https://cloverera.com/team-health/', changefreq: 'monthly', priority: '0.6' },
  { loc: 'https://cloverera.com/turnover-analysis/', changefreq: 'monthly', priority: '0.6' },
  { loc: 'https://cloverera.com/what-is-employee-engagement/', changefreq: 'monthly', priority: '0.6' },
  { loc: 'https://cloverera.com/engagement-strategies/', changefreq: 'monthly', priority: '0.6' },
  { loc: 'https://cloverera.com/employee-engagement-best-practices/', changefreq: 'monthly', priority: '0.6' },
  { loc: 'https://cloverera.com/how-to-measure-employee-engagement/', changefreq: 'monthly', priority: '0.6' },
  { loc: 'https://cloverera.com/active-employee-engagement-management/', changefreq: 'monthly', priority: '0.6' },

  // Workplace solutions
  { loc: 'https://cloverera.com/workplace-solutions/', changefreq: 'monthly', priority: '0.6' },
  { loc: 'https://cloverera.com/workplace-solutions/bad-bosses-transformation.html', changefreq: 'monthly', priority: '0.5' },
  { loc: 'https://cloverera.com/workplace-solutions/change-management.html', changefreq: 'monthly', priority: '0.5' },
  { loc: 'https://cloverera.com/workplace-solutions/culture-transformation.html', changefreq: 'monthly', priority: '0.5' },
  { loc: 'https://cloverera.com/workplace-solutions/Employee-burnout-solutions.html', changefreq: 'monthly', priority: '0.5' },
  { loc: 'https://cloverera.com/workplace-solutions/employee-stress-management.html', changefreq: 'monthly', priority: '0.5' },
  { loc: 'https://cloverera.com/workplace-solutions/focus-optimization.html', changefreq: 'monthly', priority: '0.5' },
  { loc: 'https://cloverera.com/workplace-solutions/leadership-training-programs.html', changefreq: 'monthly', priority: '0.5' },
  { loc: 'https://cloverera.com/workplace-solutions/manager-coaching-services.html', changefreq: 'monthly', priority: '0.5' },
  { loc: 'https://cloverera.com/workplace-solutions/mental-health-support.html', changefreq: 'monthly', priority: '0.5' },
  { loc: 'https://cloverera.com/workplace-solutions/productivity-loss-solutions.html', changefreq: 'monthly', priority: '0.5' },
  { loc: 'https://cloverera.com/workplace-solutions/quiet-quitting-identification.html', changefreq: 'monthly', priority: '0.5' },
  { loc: 'https://cloverera.com/workplace-solutions/retention-crisis-solutions.html', changefreq: 'monthly', priority: '0.5' },
  { loc: 'https://cloverera.com/workplace-solutions/toxic-management-solutions.html', changefreq: 'monthly', priority: '0.5' },
  { loc: 'https://cloverera.com/workplace-solutions/toxic-workplace-culture.html', changefreq: 'monthly', priority: '0.5' },
  { loc: 'https://cloverera.com/workplace-solutions/workplace-anxiety-solutions.html', changefreq: 'monthly', priority: '0.5' },

  // Location pages
  { loc: 'https://cloverera.com/locations/', changefreq: 'monthly', priority: '0.5' },
  { loc: 'https://cloverera.com/locations/london/', changefreq: 'monthly', priority: '0.5' },
  { loc: 'https://cloverera.com/locations/manchester/', changefreq: 'monthly', priority: '0.5' },
  { loc: 'https://cloverera.com/locations/edinburgh/', changefreq: 'monthly', priority: '0.5' },
  { loc: 'https://cloverera.com/locations/glasgow/', changefreq: 'monthly', priority: '0.5' },
  { loc: 'https://cloverera.com/locations/birmingham/', changefreq: 'monthly', priority: '0.5' },
  { loc: 'https://cloverera.com/locations/bristol/', changefreq: 'monthly', priority: '0.5' },
  { loc: 'https://cloverera.com/locations/leeds/', changefreq: 'monthly', priority: '0.5' },
  { loc: 'https://cloverera.com/locations/liverpool/', changefreq: 'monthly', priority: '0.5' },
  { loc: 'https://cloverera.com/locations/newcastle/', changefreq: 'monthly', priority: '0.5' },
  { loc: 'https://cloverera.com/locations/sheffield/', changefreq: 'monthly', priority: '0.5' },
  { loc: 'https://cloverera.com/locations/nottingham/', changefreq: 'monthly', priority: '0.5' },
  { loc: 'https://cloverera.com/locations/leicester/', changefreq: 'monthly', priority: '0.5' },
  { loc: 'https://cloverera.com/locations/cardiff/', changefreq: 'monthly', priority: '0.5' },
  { loc: 'https://cloverera.com/locations/belfast/', changefreq: 'monthly', priority: '0.5' },
  { loc: 'https://cloverera.com/locations/dublin/', changefreq: 'monthly', priority: '0.5' },

  // Research
  { loc: 'https://cloverera.com/research/', changefreq: 'monthly', priority: '0.6' },
  { loc: 'https://cloverera.com/research/2026-employee-experience-reality.html', changefreq: 'monthly', priority: '0.6' },
  { loc: 'https://cloverera.com/research/clover-framework-neuroscience.html', changefreq: 'monthly', priority: '0.6' },
  { loc: 'https://cloverera.com/research/daily-checkins-vs-annual-surveys.html', changefreq: 'monthly', priority: '0.6' },
  { loc: 'https://cloverera.com/research/uk-employee-engagement-statistics.html', changefreq: 'monthly', priority: '0.6' },

  // Business & conversion
  { loc: 'https://cloverera.com/business-case/', changefreq: 'monthly', priority: '0.6' },
  { loc: 'https://cloverera.com/case-studies/', changefreq: 'monthly', priority: '0.6' },
  { loc: 'https://cloverera.com/pilot/', changefreq: 'monthly', priority: '0.6' },
  { loc: 'https://cloverera.com/roundtable/', changefreq: 'monthly', priority: '0.6' },
  { loc: 'https://cloverera.com/tech-ceo-guide/', changefreq: 'monthly', priority: '0.6' },
  { loc: 'https://cloverera.com/info/', changefreq: 'monthly', priority: '0.6' },
  { loc: 'https://cloverera.com/info/ceo.html', changefreq: 'monthly', priority: '0.6' },
  { loc: 'https://cloverera.com/info/cfo.html', changefreq: 'monthly', priority: '0.6' },
  { loc: 'https://cloverera.com/info/chro.html', changefreq: 'monthly', priority: '0.6' },
  { loc: 'https://cloverera.com/partners/', changefreq: 'monthly', priority: '0.5' },

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
