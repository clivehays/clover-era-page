const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local if exists
function loadEnvFile() {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split(/\r?\n/).forEach(line => {
            line = line.trim();
            if (!line || line.startsWith('#')) return;
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim();
                if (!process.env[key]) {
                    process.env[key] = value;
                }
            }
        });
    }
}

loadEnvFile();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in environment variables');
    console.error('   Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env.local or environment');
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

// Generate Schema.org markup with GEO enhancements
function generateSchemaMarkup(article, publishDate, readTime, wordCount) {
    const schemas = [];

    // Enhanced BlogPosting schema with GEO fields
    const blogPostingSchema = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "@id": `https://cloverera.com/Blog/${article.slug}.html#article`,
        "headline": escapeHtml(article.title),
        "description": escapeHtml(article.excerpt || article.meta_description || ''),
        "datePublished": publishDate,
        "dateModified": new Date(article.updated_at).toISOString(),
        "author": {
            "@type": "Person",
            "name": article.author_name || "Clover ERA Team"
        },
        "publisher": {
            "@type": "Organization",
            "name": "Clover ERA",
            "logo": {
                "@type": "ImageObject",
                "url": "https://cloverera.com/images/logo.png"
            }
        },
        "url": `https://cloverera.com/Blog/${article.slug}.html`,
        "mainEntityOfPage": `https://cloverera.com/Blog/${article.slug}.html`,
        "wordCount": wordCount,
        "timeRequired": `PT${readTime}M`,
        "inLanguage": "en-US"
    };

    // Add optional fields
    if (article.featured_image) {
        blogPostingSchema.image = {
            "@type": "ImageObject",
            "url": article.featured_image,
            "width": 1200,
            "height": 630
        };
    }

    if (article.category) {
        blogPostingSchema.articleSection = article.category;
    }

    // Combine meta_keywords, tags, and key_topics for comprehensive keywords
    const allKeywords = [];
    if (article.meta_keywords && article.meta_keywords.length > 0) {
        allKeywords.push(...article.meta_keywords);
    }
    if (article.tags && article.tags.length > 0) {
        allKeywords.push(...article.tags);
    }
    if (article.key_topics && article.key_topics.length > 0) {
        allKeywords.push(...article.key_topics);
    }
    if (allKeywords.length > 0) {
        blogPostingSchema.keywords = [...new Set(allKeywords)]; // Remove duplicates
    }

    // GEO: Add target audience
    if (article.target_audience) {
        blogPostingSchema.audience = {
            "@type": "Audience",
            "audienceType": article.target_audience
        };
    }

    // GEO: Add speakable for voice search optimization
    blogPostingSchema.speakable = {
        "@type": "SpeakableSpecification",
        "cssSelector": [".article-content", ".article-excerpt"]
    };

    schemas.push(blogPostingSchema);

    // GEO: Generate FAQPage schema if faq_items exists
    if (article.faq_items && Array.isArray(article.faq_items) && article.faq_items.length > 0) {
        const faqSchema = {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": article.faq_items.map(faq => ({
                "@type": "Question",
                "name": faq.question,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": faq.answer
                }
            }))
        };
        schemas.push(faqSchema);
    }

    return schemas;
}

// Generate FAQ section HTML
function generateFAQSection(faqItems) {
    if (!faqItems || !Array.isArray(faqItems) || faqItems.length === 0) {
        return '';
    }

    return `
        <div class="faq-section">
            <h2>Frequently Asked Questions</h2>
            ${faqItems.map(faq => `
            <div class="faq-item">
                <h3 class="faq-question">${escapeHtml(faq.question)}</h3>
                <div class="faq-answer">${escapeHtml(faq.answer)}</div>
            </div>`).join('')}
        </div>`;
}

// Generate article HTML
function generateArticleHTML(article) {
    const publishDate = new Date(article.published_at).toISOString();
    const readTime = article.read_time_minutes || 5;
    const wordCount = article.content.split(/\s+/).length;

    // Generate all Schema.org markup
    const schemas = generateSchemaMarkup(article, publishDate, readTime, wordCount);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <!-- SEO Meta Tags -->
    <title>${escapeHtml(article.meta_title || article.title)}</title>
    <meta name="description" content="${escapeHtml(article.meta_description || article.excerpt || '')}">
    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
    <link rel="canonical" href="${article.canonical_url || `https://cloverera.com/Blog/${article.slug}.html`}">

    <!-- Favicon -->
    <link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/images/favicon-16x16.png">
    <link rel="apple-touch-icon" sizes="180x180" href="/images/apple-touch-icon.png">

    <!-- Open Graph -->
    <meta property="og:title" content="${escapeHtml(article.meta_title || article.title)}">
    <meta property="og:description" content="${escapeHtml(article.meta_description || article.excerpt || '')}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="https://cloverera.com/Blog/${article.slug}.html">
    ${article.featured_image ? `<meta property="og:image" content="${article.featured_image}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="${escapeHtml(article.title)}">` : ''}
    <meta property="og:site_name" content="Clover ERA">
    <meta property="article:published_time" content="${publishDate}">
    ${article.updated_at ? `<meta property="article:modified_time" content="${new Date(article.updated_at).toISOString()}">` : ''}
    ${article.category ? `<meta property="article:section" content="${escapeHtml(article.category)}">` : ''}
    ${article.tags ? article.tags.map(tag => `<meta property="article:tag" content="${escapeHtml(tag)}">`).join('\n    ') : ''}

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(article.meta_title || article.title)}">
    <meta name="twitter:description" content="${escapeHtml(article.meta_description || article.excerpt || '')}">
    ${article.featured_image ? `<meta name="twitter:image" content="${article.featured_image}">
    <meta name="twitter:image:alt" content="${escapeHtml(article.title)}">` : ''}

    <!-- Schema.org Markup (GEO Enhanced) -->
    ${schemas.map(schema => `<script type="application/ld+json">
    ${JSON.stringify(schema, null, 2)}
    </script>`).join('\n    ')}

    <!-- Styles -->
    <link rel="stylesheet" href="/css/mobile-responsive.css">
    <link rel="stylesheet" href="/css/breadcrumbs.css">
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

        .faq-section {
            margin: 4rem 0;
            padding: 3rem;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }

        .faq-section h2 {
            font-size: 2rem;
            margin-bottom: 2rem;
            color: var(--text-primary);
            text-align: center;
        }

        .faq-item {
            margin-bottom: 2rem;
            padding-bottom: 2rem;
            border-bottom: 1px solid var(--border-color);
        }

        .faq-item:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
        }

        .faq-question {
            font-size: 1.3rem;
            font-weight: 700;
            color: var(--primary-teal);
            margin-bottom: 1rem;
        }

        .faq-answer {
            font-size: 1.1rem;
            line-height: 1.8;
            color: var(--text-secondary);
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
    <script src="/js/header.js"></script>

    <!-- Breadcrumbs -->
    <script src="/js/breadcrumbs.js"></script>

    <!-- Article -->
    <article class="article-container">
        <div class="article-header">
            ${article.category ? `<div class="article-category">${escapeHtml(article.category)}</div>` : ''}
            <h1 class="article-title">${escapeHtml(article.title)}</h1>
            <div class="article-meta">
                <span>✍️ ${escapeHtml(article.author_name || 'Clover ERA Team')}</span>
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

        ${generateFAQSection(article.faq_items)}

        <div class="cta-section">
            <h2>What's Turnover Really Costing You?</h2>
            <p style="margin-top: 1rem; color: var(--text-secondary);">
                Most companies underestimate turnover costs by 50-70%. Use our calculator to find out what departures actually cost your organization—then see how Clover ERA helps you prevent them.
            </p>
            <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; margin-top: 1.5rem;">
                <a href="/calculator/" class="cta-button">Calculate Your Turnover Cost</a>
                <a href="/pricing/" class="cta-button" style="background: white; color: var(--primary-teal); border: 2px solid var(--primary-teal);">View Pricing</a>
            </div>
        </div>
    </article>

    <!-- Footer -->
    <script src="/js/footer.js"></script>
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
