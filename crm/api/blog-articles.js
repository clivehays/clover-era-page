/**
 * Blog Articles API Endpoints
 *
 * RESTful API for managing blog articles in the Clover ERA CMS
 * Includes CRUD operations, publishing, scheduling, and analytics
 */

const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const db = require('../db/connection'); // Assumes PostgreSQL connection
const { authenticate, authorize } = require('../middleware/auth');
const { generateStaticHTML } = require('../services/static-generator');

// =====================================================
// Validation Middleware
// =====================================================

const validateErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// =====================================================
// GET /api/blog/articles
// List all articles with filtering and pagination
// =====================================================

router.get('/articles',
    authenticate,
    [
        query('status').optional().isIn(['draft', 'pending_review', 'scheduled', 'published', 'archived']),
        query('category').optional().isString(),
        query('author_id').optional().isUUID(),
        query('page').optional().isInt({ min: 1 }).toInt(),
        query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
        query('search').optional().isString(),
        query('sort').optional().isIn(['created_at', 'updated_at', 'published_at', 'title', 'view_count']),
        query('order').optional().isIn(['asc', 'desc']),
        validateErrors
    ],
    async (req, res) => {
        try {
            const {
                status,
                category,
                author_id,
                page = 1,
                limit = 20,
                search,
                sort = 'updated_at',
                order = 'desc'
            } = req.query;

            const offset = (page - 1) * limit;

            // Build query
            let whereConditions = [];
            let queryParams = [];
            let paramIndex = 1;

            // Filter by status
            if (status) {
                whereConditions.push(`status = $${paramIndex}`);
                queryParams.push(status);
                paramIndex++;
            }

            // Filter by category
            if (category) {
                whereConditions.push(`category = $${paramIndex}`);
                queryParams.push(category);
                paramIndex++;
            }

            // Filter by author
            if (author_id) {
                whereConditions.push(`author_id = $${paramIndex}`);
                queryParams.push(author_id);
                paramIndex++;
            }

            // Full-text search
            if (search) {
                whereConditions.push(`to_tsvector('english', title || ' ' || COALESCE(excerpt, '') || ' ' || content) @@ plainto_tsquery('english', $${paramIndex})`);
                queryParams.push(search);
                paramIndex++;
            }

            // Authorization: non-admin users can only see their own articles
            if (req.user.user_type !== 'admin') {
                whereConditions.push(`author_id = $${paramIndex}`);
                queryParams.push(req.user.id);
                paramIndex++;
            }

            const whereClause = whereConditions.length > 0
                ? 'WHERE ' + whereConditions.join(' AND ')
                : '';

            // Count total results
            const countQuery = `SELECT COUNT(*) FROM blog_articles ${whereClause}`;
            const countResult = await db.query(countQuery, queryParams);
            const totalCount = parseInt(countResult.rows[0].count);

            // Fetch articles
            const articlesQuery = `
                SELECT
                    a.id,
                    a.title,
                    a.slug,
                    a.excerpt,
                    a.featured_image,
                    a.status,
                    a.category,
                    a.tags,
                    a.view_count,
                    a.read_time_minutes,
                    a.published_at,
                    a.created_at,
                    a.updated_at,
                    u.email AS author_email,
                    u.user_type AS author_role
                FROM blog_articles a
                LEFT JOIN users u ON a.author_id = u.id
                ${whereClause}
                ORDER BY ${sort} ${order.toUpperCase()}
                LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
            `;

            queryParams.push(limit, offset);

            const result = await db.query(articlesQuery, queryParams);

            res.json({
                articles: result.rows,
                pagination: {
                    page,
                    limit,
                    total: totalCount,
                    totalPages: Math.ceil(totalCount / limit)
                }
            });

        } catch (error) {
            console.error('Error fetching articles:', error);
            res.status(500).json({ error: 'Failed to fetch articles' });
        }
    }
);

// =====================================================
// GET /api/blog/articles/:id
// Get a single article by ID
// =====================================================

router.get('/articles/:id',
    authenticate,
    [
        param('id').isUUID(),
        validateErrors
    ],
    async (req, res) => {
        try {
            const { id } = req.params;

            const query = `
                SELECT
                    a.*,
                    u.email AS author_email,
                    u.user_type AS author_role
                FROM blog_articles a
                LEFT JOIN users u ON a.author_id = u.id
                WHERE a.id = $1
            `;

            const result = await db.query(query, [id]);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Article not found' });
            }

            const article = result.rows[0];

            // Authorization: non-admin users can only see their own articles
            if (req.user.user_type !== 'admin' && article.author_id !== req.user.id) {
                return res.status(403).json({ error: 'Access denied' });
            }

            res.json({ article });

        } catch (error) {
            console.error('Error fetching article:', error);
            res.status(500).json({ error: 'Failed to fetch article' });
        }
    }
);

// =====================================================
// POST /api/blog/articles
// Create a new article
// =====================================================

router.post('/articles',
    authenticate,
    authorize(['admin', 'editor', 'author']), // Anyone with blog permissions can create
    [
        body('title').notEmpty().isString().isLength({ max: 255 }),
        body('slug').optional().isString().isLength({ max: 255 }),
        body('excerpt').optional().isString(),
        body('content').notEmpty().isString(),
        body('featured_image').optional().isURL(),
        body('status').optional().isIn(['draft', 'pending_review', 'scheduled', 'published']),
        body('meta_title').optional().isString().isLength({ max: 70 }),
        body('meta_description').optional().isString().isLength({ max: 160 }),
        body('meta_keywords').optional().isArray(),
        body('canonical_url').optional().isURL(),
        body('target_audience').optional().isString(),
        body('key_topics').optional().isArray(),
        body('related_articles').optional().isArray(),
        body('faq_items').optional().isArray(),
        body('category').optional().isString(),
        body('tags').optional().isArray(),
        body('scheduled_publish_at').optional().isISO8601(),
        validateErrors
    ],
    async (req, res) => {
        try {
            const {
                title,
                slug,
                excerpt,
                content,
                featured_image,
                status = 'draft',
                meta_title,
                meta_description,
                meta_keywords,
                canonical_url,
                target_audience,
                key_topics,
                related_articles,
                faq_items,
                category,
                tags,
                scheduled_publish_at
            } = req.body;

            // Authors can only create drafts
            const finalStatus = req.user.user_type === 'author' && status !== 'draft' ? 'draft' : status;

            const query = `
                INSERT INTO blog_articles (
                    title, slug, excerpt, content, featured_image,
                    author_id, status,
                    meta_title, meta_description, meta_keywords, canonical_url,
                    target_audience, key_topics, related_articles, faq_items,
                    category, tags, scheduled_publish_at
                ) VALUES (
                    $1, $2, $3, $4, $5,
                    $6, $7,
                    $8, $9, $10, $11,
                    $12, $13, $14, $15,
                    $16, $17, $18
                )
                RETURNING *
            `;

            const values = [
                title,
                slug || null, // Auto-generated by trigger if null
                excerpt,
                content,
                featured_image,
                req.user.id, // author_id
                finalStatus,
                meta_title,
                meta_description,
                meta_keywords,
                canonical_url,
                target_audience,
                key_topics,
                related_articles,
                faq_items ? JSON.stringify(faq_items) : null,
                category,
                tags,
                scheduled_publish_at
            ];

            const result = await db.query(query, values);
            const newArticle = result.rows[0];

            res.status(201).json({
                message: 'Article created successfully',
                article: newArticle
            });

        } catch (error) {
            console.error('Error creating article:', error);

            // Handle duplicate slug error
            if (error.code === '23505' && error.constraint === 'blog_articles_slug_key') {
                return res.status(400).json({ error: 'Article with this slug already exists' });
            }

            res.status(500).json({ error: 'Failed to create article' });
        }
    }
);

// =====================================================
// PUT /api/blog/articles/:id
// Update an existing article
// =====================================================

router.put('/articles/:id',
    authenticate,
    [
        param('id').isUUID(),
        body('title').optional().isString().isLength({ max: 255 }),
        body('slug').optional().isString().isLength({ max: 255 }),
        body('excerpt').optional().isString(),
        body('content').optional().isString(),
        body('featured_image').optional().isURL(),
        body('status').optional().isIn(['draft', 'pending_review', 'scheduled', 'published', 'archived']),
        body('meta_title').optional().isString().isLength({ max: 70 }),
        body('meta_description').optional().isString().isLength({ max: 160 }),
        body('meta_keywords').optional().isArray(),
        body('canonical_url').optional().isURL(),
        body('target_audience').optional().isString(),
        body('key_topics').optional().isArray(),
        body('related_articles').optional().isArray(),
        body('faq_items').optional().isArray(),
        body('category').optional().isString(),
        body('tags').optional().isArray(),
        body('scheduled_publish_at').optional().isISO8601(),
        validateErrors
    ],
    async (req, res) => {
        try {
            const { id } = req.params;

            // Check if article exists and user has permission
            const checkQuery = 'SELECT author_id, status FROM blog_articles WHERE id = $1';
            const checkResult = await db.query(checkQuery, [id]);

            if (checkResult.rows.length === 0) {
                return res.status(404).json({ error: 'Article not found' });
            }

            const article = checkResult.rows[0];

            // Authorization: authors can only edit their own drafts
            if (req.user.user_type === 'author' &&
                (article.author_id !== req.user.id || article.status !== 'draft')) {
                return res.status(403).json({ error: 'Access denied' });
            }

            // Build update query dynamically
            const updates = [];
            const values = [];
            let paramIndex = 1;

            const allowedFields = [
                'title', 'slug', 'excerpt', 'content', 'featured_image', 'status',
                'meta_title', 'meta_description', 'meta_keywords', 'canonical_url',
                'target_audience', 'key_topics', 'related_articles', 'faq_items',
                'category', 'tags', 'scheduled_publish_at'
            ];

            allowedFields.forEach(field => {
                if (req.body.hasOwnProperty(field)) {
                    updates.push(`${field} = $${paramIndex}`);

                    // Handle JSONB fields
                    if (field === 'faq_items' && req.body[field]) {
                        values.push(JSON.stringify(req.body[field]));
                    } else {
                        values.push(req.body[field]);
                    }

                    paramIndex++;
                }
            });

            if (updates.length === 0) {
                return res.status(400).json({ error: 'No fields to update' });
            }

            // Add article ID to values
            values.push(id);

            const updateQuery = `
                UPDATE blog_articles
                SET ${updates.join(', ')}
                WHERE id = $${paramIndex}
                RETURNING *
            `;

            const result = await db.query(updateQuery, values);
            const updatedArticle = result.rows[0];

            res.json({
                message: 'Article updated successfully',
                article: updatedArticle
            });

        } catch (error) {
            console.error('Error updating article:', error);

            // Handle duplicate slug error
            if (error.code === '23505' && error.constraint === 'blog_articles_slug_key') {
                return res.status(400).json({ error: 'Article with this slug already exists' });
            }

            res.status(500).json({ error: 'Failed to update article' });
        }
    }
);

// =====================================================
// DELETE /api/blog/articles/:id
// Delete an article
// =====================================================

router.delete('/articles/:id',
    authenticate,
    authorize(['admin', 'editor']), // Only admin and editors can delete
    [
        param('id').isUUID(),
        validateErrors
    ],
    async (req, res) => {
        try {
            const { id } = req.params;

            // Check if article exists
            const checkQuery = 'SELECT id FROM blog_articles WHERE id = $1';
            const checkResult = await db.query(checkQuery, [id]);

            if (checkResult.rows.length === 0) {
                return res.status(404).json({ error: 'Article not found' });
            }

            // Delete article (cascades to revisions and analytics)
            const deleteQuery = 'DELETE FROM blog_articles WHERE id = $1';
            await db.query(deleteQuery, [id]);

            res.json({ message: 'Article deleted successfully' });

        } catch (error) {
            console.error('Error deleting article:', error);
            res.status(500).json({ error: 'Failed to delete article' });
        }
    }
);

// =====================================================
// POST /api/blog/articles/:id/publish
// Publish an article and generate static HTML
// =====================================================

router.post('/articles/:id/publish',
    authenticate,
    authorize(['admin', 'editor']), // Only admin and editors can publish
    [
        param('id').isUUID(),
        validateErrors
    ],
    async (req, res) => {
        try {
            const { id } = req.params;

            // Get article
            const getQuery = 'SELECT * FROM blog_articles WHERE id = $1';
            const getResult = await db.query(getQuery, [id]);

            if (getResult.rows.length === 0) {
                return res.status(404).json({ error: 'Article not found' });
            }

            const article = getResult.rows[0];

            // Update status to published
            const updateQuery = `
                UPDATE blog_articles
                SET status = 'published', published_at = CURRENT_TIMESTAMP
                WHERE id = $1
                RETURNING *
            `;

            const updateResult = await db.query(updateQuery, [id]);
            const publishedArticle = updateResult.rows[0];

            // Generate static HTML file
            try {
                const htmlPath = await generateStaticHTML(publishedArticle);

                res.json({
                    message: 'Article published successfully',
                    article: publishedArticle,
                    html_path: htmlPath
                });
            } catch (htmlError) {
                console.error('Error generating static HTML:', htmlError);

                // Still mark as published, but warn about HTML generation failure
                res.status(207).json({
                    message: 'Article published but HTML generation failed',
                    article: publishedArticle,
                    warning: 'Static HTML file was not generated'
                });
            }

        } catch (error) {
            console.error('Error publishing article:', error);
            res.status(500).json({ error: 'Failed to publish article' });
        }
    }
);

// =====================================================
// POST /api/blog/articles/:id/unpublish
// Unpublish an article (archive it)
// =====================================================

router.post('/articles/:id/unpublish',
    authenticate,
    authorize(['admin', 'editor']),
    [
        param('id').isUUID(),
        validateErrors
    ],
    async (req, res) => {
        try {
            const { id } = req.params;

            const query = `
                UPDATE blog_articles
                SET status = 'archived'
                WHERE id = $1 AND status = 'published'
                RETURNING *
            `;

            const result = await db.query(query, [id]);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Article not found or not published' });
            }

            res.json({
                message: 'Article unpublished successfully',
                article: result.rows[0]
            });

        } catch (error) {
            console.error('Error unpublishing article:', error);
            res.status(500).json({ error: 'Failed to unpublish article' });
        }
    }
);

// =====================================================
// GET /api/blog/articles/:id/analytics
// Get analytics for a specific article
// =====================================================

router.get('/articles/:id/analytics',
    authenticate,
    [
        param('id').isUUID(),
        query('days').optional().isInt({ min: 1, max: 365 }).toInt(),
        validateErrors
    ],
    async (req, res) => {
        try {
            const { id } = req.params;
            const { days = 30 } = req.query;

            // Check if article exists
            const checkQuery = 'SELECT id, author_id FROM blog_articles WHERE id = $1';
            const checkResult = await db.query(checkQuery, [id]);

            if (checkResult.rows.length === 0) {
                return res.status(404).json({ error: 'Article not found' });
            }

            // Authorization: authors can only see their own article analytics
            if (req.user.user_type === 'author' &&
                checkResult.rows[0].author_id !== req.user.id) {
                return res.status(403).json({ error: 'Access denied' });
            }

            // Get analytics summary
            const summaryQuery = 'SELECT * FROM get_article_analytics_summary($1, $2)';
            const summaryResult = await db.query(summaryQuery, [id, days]);
            const summary = summaryResult.rows[0];

            // Get daily analytics
            const dailyQuery = `
                SELECT
                    date,
                    page_views,
                    unique_visitors,
                    avg_time_on_page,
                    bounce_rate,
                    source_direct + source_organic + source_social + source_referral + source_email AS total_sources,
                    ai_chatgpt + ai_perplexity + ai_gemini + ai_other AS total_ai
                FROM blog_article_analytics
                WHERE article_id = $1 AND date >= CURRENT_DATE - $2
                ORDER BY date DESC
            `;

            const dailyResult = await db.query(dailyQuery, [id, days]);

            res.json({
                summary,
                daily: dailyResult.rows
            });

        } catch (error) {
            console.error('Error fetching analytics:', error);
            res.status(500).json({ error: 'Failed to fetch analytics' });
        }
    }
);

// =====================================================
// GET /api/blog/categories
// Get all categories with article counts
// =====================================================

router.get('/categories',
    authenticate,
    async (req, res) => {
        try {
            const query = `
                SELECT
                    category,
                    COUNT(*) AS article_count
                FROM blog_articles
                WHERE category IS NOT NULL
                    AND status = 'published'
                GROUP BY category
                ORDER BY article_count DESC
            `;

            const result = await db.query(query);

            res.json({ categories: result.rows });

        } catch (error) {
            console.error('Error fetching categories:', error);
            res.status(500).json({ error: 'Failed to fetch categories' });
        }
    }
);

// =====================================================
// GET /api/blog/tags
// Get all tags with article counts
// =====================================================

router.get('/tags',
    authenticate,
    async (req, res) => {
        try {
            const query = `
                SELECT
                    unnest(tags) AS tag,
                    COUNT(*) AS article_count
                FROM blog_articles
                WHERE tags IS NOT NULL
                    AND status = 'published'
                GROUP BY tag
                ORDER BY article_count DESC
            `;

            const result = await db.query(query);

            res.json({ tags: result.rows });

        } catch (error) {
            console.error('Error fetching tags:', error);
            res.status(500).json({ error: 'Failed to fetch tags' });
        }
    }
);

module.exports = router;
