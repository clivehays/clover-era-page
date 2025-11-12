const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Escape HTML
function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Generate article HTML
function generateArticleHTML(article) {
    const publishDate = new Date(article.published_at).toISOString();
    const readTime = article.read_time_minutes || 5;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <!-- SEO Meta Tags -->
    <title>${escapeHtml(article.meta_title || article.title)}</title>
    <meta name="description" content="${escapeHtml(article.meta_description || article.excerpt || '')}">
    ${article.meta_keywords && article.meta_keywords.length > 0 ? `<meta name="keywords" content="${article.meta_keywords.join(', ')}">` : ''}
    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
    <link rel="canonical" href="https://cloverera.com/Blog/${article.slug}.html">

    <!-- Favicon -->
    <link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/images/favicon-16x16.png">
    <link rel="apple-touch-icon" sizes="180x180" href="/images/apple-touch-icon.png">

    <!-- Open Graph -->
    <meta property="og:title" content="${escapeHtml(article.meta_title || article.title)}">
    <meta property="og:description" content="${escapeHtml(article.meta_description || article.excerpt || '')}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="https://cloverera.com/Blog/${article.slug}.html">
    ${article.featured_image ? `<meta property="og:image" content="${article.featured_image}">` : ''}
    <meta property="og:site_name" content="Clover ERA">
    <meta property="article:published_time" content="${publishDate}">
    ${article.category ? `<meta property="article:section" content="${article.category}">` : ''}
    ${article.tags ? article.tags.map(tag => `<meta property="article:tag" content="${tag}">`).join('\n    ') : ''}

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(article.meta_title || article.title)}">
    <meta name="twitter:description" content="${escapeHtml(article.meta_description || article.excerpt || '')}">
    ${article.featured_image ? `<meta name="twitter:image" content="${article.featured_image}">` : ''}

    <!-- Schema.org Markup -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "@id": "https://cloverera.com/Blog/${article.slug}.html#article",
      "headline": "${escapeHtml(article.title)}",
      "description": "${escapeHtml(article.excerpt || article.meta_description || '')}",
      "datePublished": "${publishDate}",
      "dateModified": "${new Date(article.updated_at).toISOString()}",
      "author": {
        "@type": "Person",
        "name": "Clover ERA Team"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Clover ERA",
        "logo": {
          "@type": "ImageObject",
          "url": "https://cloverera.com/images/logo.png"
        }
      },
      ${article.featured_image ? `"image": "${article.featured_image}",` : ''}
      "url": "https://cloverera.com/Blog/${article.slug}.html",
      "mainEntityOfPage": "https://cloverera.com/Blog/${article.slug}.html",
      ${article.category ? `"articleSection": "${article.category}",` : ''}
      ${article.tags ? `"keywords": ${JSON.stringify(article.tags)},` : ''}
      "wordCount": ${article.content.split(/\s+/).length},
      "timeRequired": "PT${readTime}M"
    }
    </script>

    <!-- Styles -->
    <link rel="stylesheet" href="/css/mobile-responsive.css">
    <style>
        :root {
            --primary-teal: #1ba098;
            --deep-teal: #158f87;
            --soft-beige: #f9f7f4;
            --warm-cream: #fdfbf7;
            --text-primary: #2d3748;
            --text-secondary: #4a5568;
            --border-color: #e2e8f0;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: var(--warm-cream);
            color: var(--text-primary);
            line-height: 1.8;
        }

        header {
            background: white;
            border-bottom: 1px solid var(--border-color);
            padding: 1rem 0;
            position: sticky;
            top: 0;
            z-index: 100;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        .header-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .logo {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--primary-teal);
            text-decoration: none;
        }

        .nav-links {
            display: flex;
            gap: 2rem;
        }

        .nav-links a {
            color: var(--text-primary);
            text-decoration: none;
            font-weight: 500;
            transition: color 0.3s;
        }

        .nav-links a:hover {
            color: var(--primary-teal);
        }

        .article-container {
            max-width: 800px;
            margin: 3rem auto;
            padding: 0 2rem;
        }

        .article-header {
            margin-bottom: 3rem;
        }

        .article-category {
            color: var(--primary-teal);
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.9rem;
            letter-spacing: 0.05em;
            margin-bottom: 1rem;
        }

        .article-title {
            font-size: 2.5rem;
            font-weight: 800;
            color: var(--text-primary);
            line-height: 1.2;
            margin-bottom: 1rem;
        }

        .article-meta {
            display: flex;
            gap: 1.5rem;
            color: var(--text-secondary);
            font-size: 0.95rem;
            margin-bottom: 2rem;
        }

        .article-excerpt {
            font-size: 1.2rem;
            color: var(--text-secondary);
            line-height: 1.6;
            margin-bottom: 2rem;
        }

        ${article.featured_image ? `
        .featured-image {
            width: 100%;
            border-radius: 12px;
            margin-bottom: 3rem;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }` : ''}

        .article-content {
            font-size: 1.1rem;
            line-height: 1.8;
        }

        .article-content h2 {
            font-size: 1.8rem;
            margin: 2rem 0 1rem;
            color: var(--text-primary);
        }

        .article-content h3 {
            font-size: 1.4rem;
            margin: 1.5rem 0 0.75rem;
            color: var(--text-primary);
        }

        .article-content p {
            margin-bottom: 1.5rem;
        }

        .article-content ul, .article-content ol {
            margin: 1.5rem 0;
            padding-left: 2rem;
        }

        .article-content li {
            margin-bottom: 0.5rem;
        }

        .article-content blockquote {
            border-left: 4px solid var(--primary-teal);
            padding-left: 1.5rem;
            margin: 2rem 0;
            font-style: italic;
            color: var(--text-secondary);
        }

        .article-content a {
            color: var(--primary-teal);
            text-decoration: none;
            border-bottom: 1px solid transparent;
            transition: border-color 0.3s;
        }

        .article-content a:hover {
            border-bottom-color: var(--primary-teal);
        }

        .article-content img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            margin: 2rem 0;
        }

        .article-tags {
            margin-top: 3rem;
            padding-top: 2rem;
            border-top: 1px solid var(--border-color);
        }

        .tag {
            display: inline-block;
            background: var(--soft-beige);
            color: var(--text-primary);
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-size: 0.9rem;
            margin: 0.25rem;
            text-decoration: none;
        }

        .cta-section {
            background: white;
            border-radius: 12px;
            padding: 3rem;
            margin: 4rem 0;
            text-align: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }

        .cta-button {
            display: inline-block;
            background: var(--primary-teal);
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            margin-top: 1rem;
            transition: all 0.3s;
        }

        .cta-button:hover {
            background: var(--deep-teal);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(27, 160, 152, 0.3);
        }

        footer {
            background: white;
            border-top: 1px solid var(--border-color);
            padding: 2rem 0;
            margin-top: 4rem;
        }

        .footer-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 2rem;
            text-align: center;
            color: var(--text-secondary);
        }

        @media (max-width: 768px) {
            .article-title {
                font-size: 1.8rem;
            }

            .article-content {
                font-size: 1rem;
            }

            .article-meta {
                flex-wrap: wrap;
            }
        }
    </style>
</head>
<body>
    <!-- Header -->
    <header>
        <div class="header-container">
            <a href="/" class="logo">Clover ERA</a>
            <nav class="nav-links">
                <a href="/Blog/">Blog</a>
                <a href="/about.html">About</a>
                <a href="/contact.html">Contact</a>
            </nav>
        </div>
    </header>

    <!-- Article -->
    <article class="article-container">
        <div class="article-header">
            ${article.category ? `<div class="article-category">${escapeHtml(article.category)}</div>` : ''}
            <h1 class="article-title">${escapeHtml(article.title)}</h1>
            <div class="article-meta">
                <span>📅 ${formatDate(article.published_at)}</span>
                <span>⏱️ ${readTime} min read</span>
                ${article.view_count ? `<span>👁️ ${article.view_count} views</span>` : ''}
            </div>
            ${article.excerpt ? `<p class="article-excerpt">${escapeHtml(article.excerpt)}</p>` : ''}
        </div>

        ${article.featured_image ? `<img src="${article.featured_image}" alt="${escapeHtml(article.title)}" class="featured-image">` : ''}

        <div class="article-content">
            ${article.content}
        </div>

        ${article.tags && article.tags.length > 0 ? `
        <div class="article-tags">
            <strong>Tags:</strong>
            ${article.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
        </div>` : ''}

        <div class="cta-section">
            <h2>Transform Your Team's Engagement</h2>
            <p style="margin-top: 1rem; color: var(--text-secondary);">
                Discover how Clover ERA helps managers build thriving, engaged teams.
            </p>
            <a href="/early-adopter-program.html" class="cta-button">Join Early Adopter Program</a>
        </div>
    </article>

    <!-- Footer -->
    <footer>
        <div class="footer-container">
            <p>&copy; 2025 Clover ERA. All rights reserved.</p>
            <p style="margin-top: 0.5rem;">
                <a href="/privacy-policy.html" style="color: var(--text-secondary); text-decoration: none;">Privacy Policy</a> •
                <a href="/terms.html" style="color: var(--text-secondary); text-decoration: none;">Terms of Service</a>
            </p>
        </div>
    </footer>
</body>
</html>`;
}

// Main function
async function generateBlogPosts() {
    console.log('🚀 Starting blog post generation...');

    try {
        // Fetch all published articles
        const { data: articles, error } = await supabase
            .from('blog_articles')
            .select('*')
            .eq('status', 'published')
            .order('published_at', { ascending: false });

        if (error) {
            console.error('❌ Error fetching articles:', error);
            process.exit(1);
        }

        if (!articles || articles.length === 0) {
            console.log('ℹ️  No published articles found');
            return;
        }

        console.log(`📝 Found ${articles.length} published article(s)`);

        // Ensure Blog directory exists
        const blogDir = path.join(process.cwd(), 'Blog');
        if (!fs.existsSync(blogDir)) {
            fs.mkdirSync(blogDir, { recursive: true });
            console.log('📁 Created Blog directory');
        }

        // Generate HTML for each article
        let generated = 0;
        for (const article of articles) {
            const filename = `${article.slug}.html`;
            const filepath = path.join(blogDir, filename);

            console.log(`   Generating: ${filename}`);

            const html = generateArticleHTML(article);
            fs.writeFileSync(filepath, html, 'utf8');

            generated++;
            console.log(`   ✓ Generated: ${filename}`);
        }

        console.log(`✅ Successfully generated ${generated} blog post(s)!`);

    } catch (error) {
        console.error('❌ Unexpected error:', error);
        process.exit(1);
    }
}

// Run the script
generateBlogPosts();
