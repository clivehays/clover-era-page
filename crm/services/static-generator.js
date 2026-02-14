/**
 * Static HTML Generator for Blog Articles
 *
 * Generates SEO and GEO optimized static HTML files from blog articles
 * Includes Schema.org markup, Open Graph, Twitter Cards, and AI-friendly structure
 */

const fs = require('fs').promises;
const path = require('path');

// =====================================================
// Configuration
// =====================================================

const OUTPUT_DIR = path.join(__dirname, '../../blog'); // Adjust based on your structure
const TEMPLATE_PATH = path.join(__dirname, '../templates/blog-article.html');

// =====================================================
// Schema.org Generator
// =====================================================

/**
 * Generate Schema.org BlogPosting markup
 */
const generateSchemaMarkup = (article) => {
    const schema = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": article.title,
        "description": article.excerpt || article.meta_description,
        "image": article.featured_image ? [article.featured_image] : [],
        "datePublished": article.published_at,
        "dateModified": article.updated_at,
        "author": {
            "@type": "Person",
            "name": article.author_email || "Clover ERA Team",
            "jobTitle": "Employee Engagement Expert"
        },
        "publisher": {
            "@type": "Organization",
            "name": "Clover ERA",
            "logo": {
                "@type": "ImageObject",
                "url": "https://cloverera.com/images/favicon-32x32.png"
            }
        },
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": `https://cloverera.com/blog/${article.slug}.html`
        }
    };

    // Add FAQ schema if available
    if (article.faq_items && article.faq_items.length > 0) {
        schema.mainEntity = {
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
    }

    return JSON.stringify(schema, null, 2);
};

// =====================================================
// Open Graph Meta Tags Generator
// =====================================================

/**
 * Generate Open Graph meta tags for social sharing
 */
const generateOpenGraphTags = (article) => {
    const tags = [
        `<meta property="og:type" content="article">`,
        `<meta property="og:title" content="${escapeHtml(article.meta_title || article.title)}">`,
        `<meta property="og:description" content="${escapeHtml(article.meta_description || article.excerpt || '')}">`,
        `<meta property="og:url" content="https://cloverera.com/blog/${article.slug}.html">`,
        `<meta property="og:site_name" content="Clover ERA">`,
        `<meta property="article:published_time" content="${article.published_at}">`,
        `<meta property="article:modified_time" content="${article.updated_at}">`
    ];

    if (article.featured_image) {
        tags.push(`<meta property="og:image" content="${article.featured_image}">`);
        tags.push(`<meta property="og:image:alt" content="${escapeHtml(article.title)}">`);
    }

    if (article.category) {
        tags.push(`<meta property="article:section" content="${escapeHtml(article.category)}">`);
    }

    if (article.tags && article.tags.length > 0) {
        article.tags.forEach(tag => {
            tags.push(`<meta property="article:tag" content="${escapeHtml(tag)}">`);
        });
    }

    return tags.join('\n    ');
};

// =====================================================
// Twitter Card Meta Tags Generator
// =====================================================

/**
 * Generate Twitter Card meta tags
 */
const generateTwitterCardTags = (article) => {
    const tags = [
        `<meta name="twitter:card" content="summary_large_image">`,
        `<meta name="twitter:title" content="${escapeHtml(article.meta_title || article.title)}">`,
        `<meta name="twitter:description" content="${escapeHtml(article.meta_description || article.excerpt || '')}">`,
        `<meta name="twitter:site" content="@CloverERA">`
    ];

    if (article.featured_image) {
        tags.push(`<meta name="twitter:image" content="${article.featured_image}">`);
        tags.push(`<meta name="twitter:image:alt" content="${escapeHtml(article.title)}">`);
    }

    return tags.join('\n    ');
};

// =====================================================
// GEO (Generative Engine Optimization) Markup
// =====================================================

/**
 * Generate AI-friendly metadata for ChatGPT, Perplexity, Gemini
 */
const generateGEOMarkup = (article) => {
    let markup = '';

    // Target audience (helps AI understand context)
    if (article.target_audience) {
        markup += `\n    <meta name="audience" content="${escapeHtml(article.target_audience)}">`;
    }

    // Key topics (helps AI categorize)
    if (article.key_topics && article.key_topics.length > 0) {
        markup += `\n    <meta name="keywords" content="${article.key_topics.map(escapeHtml).join(', ')}">`;
    }

    // Content summary for AI (if available)
    if (article.excerpt) {
        markup += `\n    <meta name="description" content="${escapeHtml(article.excerpt)}">`;
    }

    return markup;
};

// =====================================================
// FAQ Section Generator
// =====================================================

/**
 * Generate HTML for FAQ section with Schema.org markup
 */
const generateFAQSection = (faqItems) => {
    if (!faqItems || faqItems.length === 0) {
        return '';
    }

    const faqHTML = faqItems.map(faq => `
        <div class="faq-item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
            <h3 itemprop="name">${escapeHtml(faq.question)}</h3>
            <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
                <div itemprop="text">
                    <p>${escapeHtml(faq.answer)}</p>
                </div>
            </div>
        </div>
    `).join('\n');

    return `
        <section class="faq-section" itemscope itemtype="https://schema.org/FAQPage">
            <h2>Frequently Asked Questions</h2>
            ${faqHTML}
        </section>
    `;
};

// =====================================================
// Related Articles Section
// =====================================================

/**
 * Generate related articles section (placeholder - would fetch from DB in real implementation)
 */
const generateRelatedArticlesSection = (relatedArticles) => {
    if (!relatedArticles || relatedArticles.length === 0) {
        return '';
    }

    return `
        <section class="related-articles">
            <h2>Related Articles</h2>
            <div class="related-grid">
                <!-- Related articles would be fetched from database -->
                <p>Related articles: ${relatedArticles.join(', ')}</p>
            </div>
        </section>
    `;
};

// =====================================================
// Main HTML Generator
// =====================================================

/**
 * Generate complete HTML file for an article
 */
const generateStaticHTML = async (article) => {
    try {
        // Read template
        let template;
        try {
            template = await fs.readFile(TEMPLATE_PATH, 'utf-8');
        } catch (error) {
            // If template doesn't exist, use embedded template
            template = getDefaultTemplate();
        }

        // Generate all metadata
        const schemaMarkup = generateSchemaMarkup(article);
        const openGraphTags = generateOpenGraphTags(article);
        const twitterCardTags = generateTwitterCardTags(article);
        const geoMarkup = generateGEOMarkup(article);
        const faqSection = generateFAQSection(article.faq_items);
        const relatedSection = generateRelatedArticlesSection(article.related_articles);

        // Replace template variables
        let html = template
            .replace(/{{TITLE}}/g, escapeHtml(article.title))
            .replace(/{{META_TITLE}}/g, escapeHtml(article.meta_title || article.title))
            .replace(/{{META_DESCRIPTION}}/g, escapeHtml(article.meta_description || article.excerpt || ''))
            .replace(/{{CANONICAL_URL}}/g, article.canonical_url || `https://cloverera.com/blog/${article.slug}.html`)
            .replace(/{{SLUG}}/g, article.slug)
            .replace(/{{SCHEMA_MARKUP}}/g, schemaMarkup)
            .replace(/{{OPEN_GRAPH_TAGS}}/g, openGraphTags)
            .replace(/{{TWITTER_CARD_TAGS}}/g, twitterCardTags)
            .replace(/{{GEO_MARKUP}}/g, geoMarkup)
            .replace(/{{FEATURED_IMAGE}}/g, article.featured_image || '')
            .replace(/{{EXCERPT}}/g, escapeHtml(article.excerpt || ''))
            .replace(/{{CONTENT}}/g, article.content) // Content is already HTML
            .replace(/{{CATEGORY}}/g, escapeHtml(article.category || 'Uncategorized'))
            .replace(/{{TAGS}}/g, article.tags ? article.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join(' ') : '')
            .replace(/{{PUBLISHED_DATE}}/g, formatDate(article.published_at))
            .replace(/{{READ_TIME}}/g, article.read_time_minutes || '5')
            .replace(/{{FAQ_SECTION}}/g, faqSection)
            .replace(/{{RELATED_ARTICLES}}/g, relatedSection)
            .replace(/{{YEAR}}/g, new Date().getFullYear());

        // Ensure output directory exists
        await fs.mkdir(OUTPUT_DIR, { recursive: true });

        // Write file
        const outputPath = path.join(OUTPUT_DIR, `${article.slug}.html`);
        await fs.writeFile(outputPath, html, 'utf-8');

        console.log(`✅ Generated static HTML: ${outputPath}`);

        return outputPath;

    } catch (error) {
        console.error('Error generating static HTML:', error);
        throw error;
    }
};

// =====================================================
// Default Template (Embedded)
// =====================================================

const getDefaultTemplate = () => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{META_TITLE}} | Clover ERA Blog</title>

    <!-- SEO Meta Tags -->
    <meta name="description" content="{{META_DESCRIPTION}}">
    <link rel="canonical" href="{{CANONICAL_URL}}">

    <!-- Favicon -->
    <link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/images/favicon-16x16.png">
    <link rel="apple-touch-icon" sizes="180x180" href="/images/apple-touch-icon.png">

    <!-- Open Graph Tags -->
    {{OPEN_GRAPH_TAGS}}

    <!-- Twitter Card Tags -->
    {{TWITTER_CARD_TAGS}}

    <!-- GEO (Generative Engine Optimization) -->
    {{GEO_MARKUP}}

    <!-- Schema.org Markup -->
    <script type="application/ld+json">
    {{SCHEMA_MARKUP}}
    </script>

    <!-- Styles -->
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
            line-height: 1.6;
            color: var(--text-primary);
            background: var(--warm-cream);
        }

        header {
            background: white;
            border-bottom: 1px solid var(--border-color);
            padding: 1rem 0;
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 0 1.5rem;
        }

        nav {
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

        .nav-links a {
            color: var(--text-primary);
            text-decoration: none;
            margin-left: 2rem;
            font-weight: 500;
        }

        .nav-links a:hover {
            color: var(--primary-teal);
        }

        article {
            background: white;
            margin: 2rem auto;
            padding: 3rem;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }

        .article-meta {
            display: flex;
            gap: 1rem;
            margin-bottom: 2rem;
            font-size: 0.9rem;
            color: var(--text-secondary);
        }

        .category {
            background: var(--primary-teal);
            color: white;
            padding: 0.25rem 0.75rem;
            border-radius: 4px;
            font-weight: 600;
        }

        h1 {
            font-size: 2.5rem;
            line-height: 1.2;
            margin-bottom: 1rem;
            color: var(--text-primary);
        }

        .excerpt {
            font-size: 1.2rem;
            color: var(--text-secondary);
            margin-bottom: 2rem;
            line-height: 1.6;
        }

        .featured-image {
            width: 100%;
            border-radius: 8px;
            margin-bottom: 2rem;
        }

        .content {
            font-size: 1.1rem;
            line-height: 1.8;
        }

        .content h2 {
            margin-top: 2rem;
            margin-bottom: 1rem;
            color: var(--primary-teal);
        }

        .content h3 {
            margin-top: 1.5rem;
            margin-bottom: 0.75rem;
        }

        .content p {
            margin-bottom: 1.5rem;
        }

        .content ul, .content ol {
            margin-bottom: 1.5rem;
            padding-left: 2rem;
        }

        .content li {
            margin-bottom: 0.5rem;
        }

        .tags {
            margin-top: 2rem;
            padding-top: 2rem;
            border-top: 1px solid var(--border-color);
        }

        .tag {
            display: inline-block;
            background: var(--soft-beige);
            padding: 0.5rem 1rem;
            border-radius: 20px;
            margin-right: 0.5rem;
            margin-bottom: 0.5rem;
            font-size: 0.9rem;
            color: var(--text-secondary);
        }

        .faq-section {
            margin-top: 3rem;
            padding: 2rem;
            background: var(--soft-beige);
            border-radius: 8px;
        }

        .faq-section h2 {
            color: var(--primary-teal);
            margin-bottom: 1.5rem;
        }

        .faq-item {
            margin-bottom: 1.5rem;
        }

        .faq-item h3 {
            color: var(--text-primary);
            font-size: 1.1rem;
            margin-bottom: 0.5rem;
        }

        .cta-section {
            background: linear-gradient(135deg, var(--primary-teal), var(--deep-teal));
            color: white;
            padding: 2rem;
            border-radius: 8px;
            margin-top: 3rem;
            text-align: center;
        }

        .cta-button {
            display: inline-block;
            background: white;
            color: var(--primary-teal);
            padding: 1rem 2rem;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            margin-top: 1rem;
        }

        footer {
            text-align: center;
            padding: 2rem;
            color: var(--text-secondary);
            font-size: 0.9rem;
        }

        @media (max-width: 768px) {
            h1 {
                font-size: 2rem;
            }

            article {
                padding: 1.5rem;
            }

            .nav-links {
                display: none;
            }
        }
    </style>
</head>
<body>
    <header>
        <div class="container">
            <nav>
                <a href="/" class="logo">Clover ERA</a>
                <div class="nav-links">
                    <a href="/blog">Blog</a>
                    <a href="/#features">Features</a>
                    <a href="/start/">Start Trial</a>
                </div>
            </nav>
        </div>
    </header>

    <main class="container">
        <article>
            <div class="article-meta">
                <span class="category">{{CATEGORY}}</span>
                <span>📅 {{PUBLISHED_DATE}}</span>
                <span>⏱️ {{READ_TIME}} min read</span>
            </div>

            <h1>{{TITLE}}</h1>

            <p class="excerpt">{{EXCERPT}}</p>

            <img src="{{FEATURED_IMAGE}}" alt="{{TITLE}}" class="featured-image" onerror="this.style.display='none'">

            <div class="content">
                {{CONTENT}}
            </div>

            <div class="tags">
                {{TAGS}}
            </div>

            {{FAQ_SECTION}}

            <div class="cta-section">
                <h2>Ready to Transform Your Workplace?</h2>
                <p>Join leading organizations using Clover ERA to build engaged, thriving teams.</p>
                <a href="/start/" class="cta-button">Start Your Free Trial</a>
            </div>
        </article>
    </main>

    <footer>
        <p>&copy; {{YEAR}} Clover ERA. All rights reserved.</p>
        <p><a href="/privacy-policy.html" style="color: var(--text-secondary);">Privacy Policy</a> | <a href="/terms" style="color: var(--text-secondary);">Terms of Service</a></p>
    </footer>

    <!-- Analytics tracking code would go here -->
    <script>
        // Track page view (would integrate with your analytics system)
        console.log('Article view tracked: {{SLUG}}');
    </script>
</body>
</html>`;
};

// =====================================================
// Helper Functions
// =====================================================

/**
 * Escape HTML to prevent XSS
 */
const escapeHtml = (text) => {
    if (!text) return '';
    return text
        .toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

/**
 * Format date for display
 */
const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
};

// =====================================================
// Exports
// =====================================================

module.exports = {
    generateStaticHTML,
    generateSchemaMarkup,
    generateOpenGraphTags,
    generateTwitterCardTags,
    generateGEOMarkup
};
