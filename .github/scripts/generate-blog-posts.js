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

// Default OG image for posts without featured images
// Uses Transform-Employee-Engagement.png as default social share image
const DEFAULT_OG_IMAGE = 'https://cloverera.com/images/Transform-Employee-Engagement.png';

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Check if updated date is significantly different from publish date (more than 1 day)
function hasSignificantUpdate(publishedAt, updatedAt) {
    if (!updatedAt) return false;
    const published = new Date(publishedAt);
    const updated = new Date(updatedAt);
    const diffDays = (updated - published) / (1000 * 60 * 60 * 24);
    return diffDays > 1;
}

// Extract H2 headings for Table of Contents
function extractHeadings(content) {
    const h2Regex = /<h2[^>]*>([^<]+)<\/h2>/gi;
    const headings = [];
    let match;
    while ((match = h2Regex.exec(content)) !== null) {
        const text = match[1].trim();
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        headings.push({ text, id });
    }
    return headings;
}

// Add IDs to H2 headings in content for anchor links
function addHeadingIds(content) {
    return content.replace(/<h2([^>]*)>([^<]+)<\/h2>/gi, (match, attrs, text) => {
        const id = text.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        // Only add id if not already present
        if (attrs.includes('id=')) return match;
        return `<h2${attrs} id="${id}">${text}</h2>`;
    });
}

// Generate Table of Contents HTML
function generateTableOfContents(headings) {
    if (headings.length < 3) return ''; // Only show TOC for articles with 3+ sections

    return `
        <nav class="table-of-contents" aria-label="Table of Contents">
            <div class="toc-header">In This Article</div>
            <ol class="toc-list">
                ${headings.map(h => `<li><a href="#${h.id}">${escapeHtml(h.text)}</a></li>`).join('\n                ')}
            </ol>
        </nav>`;
}

// Generate Social Share Buttons HTML
function generateShareButtons(article) {
    const articleUrl = `https://cloverera.com/Blog/${article.slug}.html`;
    const encodedUrl = encodeURIComponent(articleUrl);
    const encodedTitle = encodeURIComponent(article.title);
    const encodedDescription = encodeURIComponent(article.meta_description || article.excerpt || '');

    return `
        <div class="share-section">
            <p class="share-title">Share this article</p>
            <div class="share-buttons">
                <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}"
                   target="_blank"
                   rel="noopener noreferrer"
                   class="share-btn share-btn-linkedin"
                   aria-label="Share on LinkedIn">
                    <svg viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    LinkedIn
                </a>
                <a href="https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}"
                   target="_blank"
                   rel="noopener noreferrer"
                   class="share-btn share-btn-twitter"
                   aria-label="Share on X (Twitter)">
                    <svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    X
                </a>
                <a href="https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}"
                   target="_blank"
                   rel="noopener noreferrer"
                   class="share-btn share-btn-facebook"
                   aria-label="Share on Facebook">
                    <svg viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    Facebook
                </a>
                <a href="mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0ARead more: ${encodedUrl}"
                   class="share-btn share-btn-email"
                   aria-label="Share via Email">
                    <svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                    Email
                </a>
                <button onclick="navigator.clipboard.writeText('${articleUrl}').then(() => { this.innerHTML = '<svg viewBox=\\'0 0 24 24\\'><path d=\\'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z\\'/></svg> Copied!'; setTimeout(() => { this.innerHTML = '<svg viewBox=\\'0 0 24 24\\'><path d=\\'M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z\\'/></svg> Copy Link'; }, 2000); })"
                        class="share-btn share-btn-copy"
                        aria-label="Copy link to clipboard">
                    <svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                    Copy Link
                </button>
            </div>
        </div>`;
}

// Generate Related Articles HTML
function generateRelatedArticles(relatedArticles) {
    if (!relatedArticles || !Array.isArray(relatedArticles) || relatedArticles.length === 0) {
        return '';
    }

    return `
        <div class="related-articles">
            <h2>Related Articles</h2>
            <div class="related-grid">
                ${relatedArticles.map(article => `
                <a href="/Blog/${article.slug}.html" class="related-card">
                    ${article.featured_image ? `<img src="${article.featured_image}" alt="${escapeHtml(article.title)}" class="related-image">` : ''}
                    <div class="related-content">
                        <h3>${escapeHtml(article.title)}</h3>
                        ${article.excerpt ? `<p>${escapeHtml(article.excerpt.substring(0, 100))}...</p>` : ''}
                    </div>
                </a>`).join('')}
            </div>
        </div>`;
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

    // Add image (use featured_image or default)
    const imageUrl = article.featured_image || DEFAULT_OG_IMAGE;
    blogPostingSchema.image = {
        "@type": "ImageObject",
        "url": imageUrl,
        "width": 1200,
        "height": 630
    };

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
    const authorName = article.author_name || 'Clover ERA Team';
    const ogImage = article.featured_image || DEFAULT_OG_IMAGE;
    const showUpdatedDate = hasSignificantUpdate(article.published_at, article.updated_at);

    // Extract headings and add IDs for TOC
    const headings = extractHeadings(article.content);
    const contentWithIds = addHeadingIds(article.content);

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
    <meta name="author" content="${escapeHtml(authorName)}">
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
    <meta property="og:image" content="${ogImage}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="${escapeHtml(article.title)}">
    <meta property="og:site_name" content="Clover ERA">
    <meta property="article:published_time" content="${publishDate}">
    <meta property="article:author" content="${escapeHtml(authorName)}">
    ${article.updated_at ? `<meta property="article:modified_time" content="${new Date(article.updated_at).toISOString()}">` : ''}
    ${article.category ? `<meta property="article:section" content="${escapeHtml(article.category)}">` : ''}
    ${article.tags ? article.tags.map(tag => `<meta property="article:tag" content="${escapeHtml(tag)}">`).join('\n    ') : ''}

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(article.meta_title || article.title)}">
    <meta name="twitter:description" content="${escapeHtml(article.meta_description || article.excerpt || '')}">
    <meta name="twitter:image" content="${ogImage}">
    <meta name="twitter:image:alt" content="${escapeHtml(article.title)}">

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

        /* Table of Contents */
        .table-of-contents {
            background: var(--soft-beige);
            border-radius: 12px;
            padding: 1.5rem 2rem;
            margin-bottom: 2rem;
        }

        .toc-header {
            font-weight: 700;
            color: var(--text-primary);
            margin-bottom: 1rem;
            font-size: 1.1rem;
        }

        .toc-list {
            list-style: decimal;
            padding-left: 1.5rem;
            margin: 0;
        }

        .toc-list li {
            margin-bottom: 0.5rem;
        }

        .toc-list a {
            color: var(--primary-teal);
            text-decoration: none;
            transition: color 0.3s;
        }

        .toc-list a:hover {
            color: var(--deep-teal);
            text-decoration: underline;
        }

        /* Updated date */
        .updated-date {
            color: var(--text-secondary);
            font-size: 0.9rem;
            font-style: italic;
            margin-top: 0.5rem;
        }

        /* Related Articles */
        .related-articles {
            margin: 4rem 0;
            padding: 3rem;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }

        .related-articles h2 {
            font-size: 1.8rem;
            margin-bottom: 2rem;
            color: var(--text-primary);
            text-align: center;
        }

        .related-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
        }

        .related-card {
            display: block;
            background: var(--soft-beige);
            border-radius: 8px;
            overflow: hidden;
            text-decoration: none;
            transition: transform 0.3s, box-shadow 0.3s;
        }

        .related-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 20px rgba(0,0,0,0.1);
        }

        .related-image {
            width: 100%;
            height: 150px;
            object-fit: cover;
        }

        .related-content {
            padding: 1rem;
        }

        .related-content h3 {
            font-size: 1rem;
            color: var(--text-primary);
            margin-bottom: 0.5rem;
            line-height: 1.3;
        }

        .related-content p {
            font-size: 0.85rem;
            color: var(--text-secondary);
            margin: 0;
        }

        /* Social Share Buttons */
        .share-section {
            margin: 3rem 0;
            padding: 2rem;
            background: var(--soft-beige);
            border-radius: 12px;
            text-align: center;
        }

        .share-title {
            font-size: 1.1rem;
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 1rem;
        }

        .share-buttons {
            display: flex;
            justify-content: center;
            gap: 1rem;
            flex-wrap: wrap;
        }

        .share-btn {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1.25rem;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 500;
            font-size: 0.95rem;
            transition: all 0.3s;
        }

        .share-btn svg {
            width: 20px;
            height: 20px;
            fill: currentColor;
        }

        .share-btn-linkedin {
            background: #0A66C2;
            color: white;
        }

        .share-btn-linkedin:hover {
            background: #004182;
            transform: translateY(-2px);
        }

        .share-btn-twitter {
            background: #000000;
            color: white;
        }

        .share-btn-twitter:hover {
            background: #333333;
            transform: translateY(-2px);
        }

        .share-btn-facebook {
            background: #1877F2;
            color: white;
        }

        .share-btn-facebook:hover {
            background: #0d5bb5;
            transform: translateY(-2px);
        }

        .share-btn-email {
            background: var(--primary-teal);
            color: white;
        }

        .share-btn-email:hover {
            background: var(--deep-teal);
            transform: translateY(-2px);
        }

        .share-btn-copy {
            background: white;
            color: var(--text-primary);
            border: 2px solid var(--border-color);
        }

        .share-btn-copy:hover {
            border-color: var(--primary-teal);
            color: var(--primary-teal);
            transform: translateY(-2px);
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
                <span>✍️ ${escapeHtml(authorName)}</span>
                <span>📅 ${formatDate(article.published_at)}</span>
                <span>⏱️ ${readTime} min read</span>
                ${article.view_count ? `<span>👁️ ${article.view_count} views</span>` : ''}
            </div>
            ${showUpdatedDate ? `<div class="updated-date">Updated: ${formatDate(article.updated_at)}</div>` : ''}
            ${article.excerpt ? `<p class="article-excerpt">${escapeHtml(article.excerpt)}</p>` : ''}
        </div>

        ${article.featured_image ? `<img src="${article.featured_image}" alt="${escapeHtml(article.title)}" class="featured-image">` : ''}

        ${generateTableOfContents(headings)}

        <div class="article-content">
            ${contentWithIds}
        </div>

        ${article.tags && article.tags.length > 0 ? `
        <div class="article-tags">
            <strong>Tags:</strong>
            ${article.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
        </div>` : ''}

        ${generateShareButtons(article)}

        ${generateFAQSection(article.faq_items)}

        ${generateRelatedArticles(article.related_articles)}

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
