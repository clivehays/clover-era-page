import { createClient } from '@supabase/supabase-js';

/**
 * CRM API endpoint for blog article management
 * Handles GET (list all), POST (create), PUT (update), DELETE operations
 * Uses service key to bypass RLS - auth is verified via session token
 */
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      console.error('Supabase env vars not configured:', {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey,
        hasAnonKey: !!supabaseAnonKey
      });
      res.status(500).json({ error: 'Database not configured' });
      return;
    }

    // Verify authentication via Authorization header (Bearer token)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const token = authHeader.substring(7);

    // Verify the token with Supabase using anon key to validate session
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      res.status(401).json({ error: 'Invalid or expired session' });
      return;
    }

    // Use service key for database operations (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Route based on method
    switch (req.method) {
      case 'GET':
        await handleGet(req, res, supabase);
        break;
      case 'POST':
        await handlePost(req, res, supabase, user);
        break;
      case 'PUT':
        await handlePut(req, res, supabase, user);
        break;
      case 'DELETE':
        await handleDelete(req, res, supabase);
        break;
      default:
        res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (err) {
    console.error('CRM Blog API error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// GET - Fetch all articles (or single article by ID)
async function handleGet(req, res, supabase) {
  const { id } = req.query;

  if (id) {
    // Fetch single article
    const { data: article, error } = await supabase
      .from('blog_articles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching article:', error);
      res.status(404).json({ error: 'Article not found' });
      return;
    }

    res.status(200).json({ article });
  } else {
    // Fetch all articles
    const { data: articles, error } = await supabase
      .from('blog_articles')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching articles:', error);
      res.status(500).json({ error: 'Failed to fetch articles' });
      return;
    }

    res.status(200).json({
      articles: articles || [],
      count: articles ? articles.length : 0
    });
  }
}

// POST - Create new article
async function handlePost(req, res, supabase, user) {
  const articleData = req.body;

  if (!articleData.title || !articleData.slug) {
    res.status(400).json({ error: 'Title and slug are required' });
    return;
  }

  // Add author info
  articleData.author_id = user.id;
  articleData.created_at = new Date().toISOString();
  articleData.updated_at = new Date().toISOString();

  const { data: newArticle, error } = await supabase
    .from('blog_articles')
    .insert([articleData])
    .select()
    .single();

  if (error) {
    console.error('Error creating article:', error);
    res.status(500).json({ error: 'Failed to create article: ' + error.message });
    return;
  }

  res.status(201).json({ article: newArticle });
}

// PUT - Update existing article
async function handlePut(req, res, supabase, user) {
  const { id } = req.query;
  const articleData = req.body;

  if (!id) {
    res.status(400).json({ error: 'Article ID is required' });
    return;
  }

  // Update timestamp
  articleData.updated_at = new Date().toISOString();

  const { data: updatedArticle, error } = await supabase
    .from('blog_articles')
    .update(articleData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating article:', error);
    res.status(500).json({ error: 'Failed to update article: ' + error.message });
    return;
  }

  res.status(200).json({ article: updatedArticle });
}

// DELETE - Delete article
async function handleDelete(req, res, supabase) {
  const { id } = req.query;

  if (!id) {
    res.status(400).json({ error: 'Article ID is required' });
    return;
  }

  const { error } = await supabase
    .from('blog_articles')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting article:', error);
    res.status(500).json({ error: 'Failed to delete article: ' + error.message });
    return;
  }

  res.status(200).json({ success: true });
}
