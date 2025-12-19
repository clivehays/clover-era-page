import { createClient } from '@supabase/supabase-js';

/**
 * Public API endpoint for fetching published blog articles
 * Uses service key to bypass RLS restrictions
 */
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase env vars not configured');
      res.status(500).json({ error: 'Database not configured' });
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch published blog articles
    const { data: articles, error } = await supabase
      .from('blog_articles')
      .select('id, title, slug, excerpt, featured_image, category, author_name, published_at, read_time_minutes')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      res.status(500).json({ error: 'Failed to fetch articles' });
      return;
    }

    // Set cache headers (cache for 5 minutes)
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    res.setHeader('Content-Type', 'application/json');

    res.status(200).json({
      articles: articles || [],
      count: articles ? articles.length : 0
    });

  } catch (err) {
    console.error('Blog articles API error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
