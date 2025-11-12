-- =====================================================
-- Migration: 010_create_blog_articles (FIXED for Supabase auth)
-- Description: Create blog articles table with SEO and GEO optimization fields
-- Date: 2025-11-12
-- =====================================================

-- Create blog_articles table
CREATE TABLE IF NOT EXISTS blog_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Content Fields
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    featured_image VARCHAR(500),

    -- Author & Ownership (use auth.users UUID directly, no foreign key for now)
    author_id UUID NOT NULL,

    -- Status Management
    status VARCHAR(20) DEFAULT 'draft' NOT NULL,

    -- SEO Optimization Fields
    meta_title VARCHAR(70),
    meta_description VARCHAR(160),
    meta_keywords TEXT[],
    canonical_url VARCHAR(500),

    -- GEO (Generative Engine Optimization) Fields
    target_audience TEXT,
    key_topics TEXT[],
    related_articles UUID[],
    faq_items JSONB,

    -- Organization & Discovery
    category VARCHAR(100),
    tags TEXT[],

    -- Publishing & Timestamps
    published_at TIMESTAMP,
    scheduled_publish_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

    -- Analytics
    view_count INTEGER DEFAULT 0,
    read_time_minutes INTEGER,

    -- Schema.org Markup (stored as JSONB for flexibility)
    schema_markup JSONB,

    -- Constraints
    CONSTRAINT check_status CHECK (
        status IN ('draft', 'pending_review', 'scheduled', 'published', 'archived')
    ),
    CONSTRAINT check_read_time CHECK (read_time_minutes >= 0),
    CONSTRAINT check_view_count CHECK (view_count >= 0)
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

-- Full-text search index (PostgreSQL gin)
CREATE INDEX idx_articles_fulltext_search ON blog_articles
    USING gin(to_tsvector('english',
        COALESCE(title, '') || ' ' ||
        COALESCE(excerpt, '') || ' ' ||
        COALESCE(content, '')
    ));

-- Status filtering (most common query)
CREATE INDEX idx_articles_status ON blog_articles(status);

-- Published articles by date (for blog landing page)
CREATE INDEX idx_articles_published ON blog_articles(published_at DESC)
    WHERE status = 'published' AND published_at IS NOT NULL;

-- Slug lookup (for URL routing)
CREATE INDEX idx_articles_slug ON blog_articles(slug);

-- Author filtering
CREATE INDEX idx_articles_author ON blog_articles(author_id);

-- Category filtering
CREATE INDEX idx_articles_category ON blog_articles(category)
    WHERE category IS NOT NULL;

-- Tags search (GIN index for array containment)
CREATE INDEX idx_articles_tags ON blog_articles USING gin(tags);

-- Scheduled publishing lookup
CREATE INDEX idx_articles_scheduled ON blog_articles(scheduled_publish_at)
    WHERE status = 'scheduled' AND scheduled_publish_at IS NOT NULL;

-- =====================================================
-- Triggers
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_blog_articles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_blog_articles_updated_at
    BEFORE UPDATE ON blog_articles
    FOR EACH ROW
    EXECUTE FUNCTION update_blog_articles_updated_at();

-- Auto-generate slug from title if not provided
CREATE OR REPLACE FUNCTION generate_blog_article_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug = lower(
            regexp_replace(
                regexp_replace(NEW.title, '[^a-zA-Z0-9\s-]', '', 'g'),
                '\s+', '-', 'g'
            )
        );

        -- Ensure uniqueness by appending timestamp if needed
        IF EXISTS (SELECT 1 FROM blog_articles WHERE slug = NEW.slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) THEN
            NEW.slug = NEW.slug || '-' || extract(epoch from CURRENT_TIMESTAMP)::bigint;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_slug
    BEFORE INSERT OR UPDATE ON blog_articles
    FOR EACH ROW
    EXECUTE FUNCTION generate_blog_article_slug();

-- Auto-calculate read time based on content
CREATE OR REPLACE FUNCTION calculate_read_time()
RETURNS TRIGGER AS $$
DECLARE
    word_count INTEGER;
    words_per_minute INTEGER := 200; -- Average reading speed
BEGIN
    IF NEW.content IS NOT NULL THEN
        -- Count words (split by whitespace)
        word_count = array_length(regexp_split_to_array(NEW.content, '\s+'), 1);
        NEW.read_time_minutes = GREATEST(1, CEIL(word_count::DECIMAL / words_per_minute));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_read_time
    BEFORE INSERT OR UPDATE OF content ON blog_articles
    FOR EACH ROW
    EXECUTE FUNCTION calculate_read_time();

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE blog_articles IS 'Blog articles with SEO and GEO optimization for Clover ERA blog';
COMMENT ON COLUMN blog_articles.status IS 'Article workflow status: draft, pending_review, scheduled, published, archived';
COMMENT ON COLUMN blog_articles.meta_keywords IS 'SEO keywords for search engines (array)';
COMMENT ON COLUMN blog_articles.target_audience IS 'GEO field: Describes who this article is for (helps AI engines understand context)';
COMMENT ON COLUMN blog_articles.key_topics IS 'GEO field: Main topics covered (helps AI engines categorize content)';
COMMENT ON COLUMN blog_articles.related_articles IS 'GEO field: Array of related article UUIDs for AI context building';
COMMENT ON COLUMN blog_articles.faq_items IS 'GEO field: FAQ structured data in JSON format for AI engines';
COMMENT ON COLUMN blog_articles.schema_markup IS 'Schema.org JSON-LD markup for rich snippets and AI understanding';
COMMENT ON COLUMN blog_articles.read_time_minutes IS 'Estimated reading time in minutes (auto-calculated from content)';

-- =====================================================
-- Rollback Script (save for reference)
-- =====================================================

-- To rollback this migration, run:
-- DROP TRIGGER IF EXISTS trigger_calculate_read_time ON blog_articles;
-- DROP TRIGGER IF EXISTS trigger_generate_slug ON blog_articles;
-- DROP TRIGGER IF EXISTS trigger_blog_articles_updated_at ON blog_articles;
-- DROP FUNCTION IF EXISTS calculate_read_time();
-- DROP FUNCTION IF EXISTS generate_blog_article_slug();
-- DROP FUNCTION IF EXISTS update_blog_articles_updated_at();
-- DROP TABLE IF EXISTS blog_articles CASCADE;
