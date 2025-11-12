-- =====================================================
-- Migration: 011_create_blog_article_revisions (FIXED)
-- Description: Create revision history table for blog articles (version control)
-- Date: 2025-11-12
-- =====================================================

-- Create blog_article_revisions table
CREATE TABLE IF NOT EXISTS blog_article_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Link to original article
    article_id UUID NOT NULL REFERENCES blog_articles(id) ON DELETE CASCADE,

    -- Revision metadata
    revision_number INTEGER NOT NULL,
    created_by UUID NOT NULL, -- No foreign key constraint to users table
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    change_summary TEXT,

    -- Snapshot of article content at this revision
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    featured_image VARCHAR(500),

    -- Snapshot of SEO fields
    meta_title VARCHAR(70),
    meta_description VARCHAR(160),
    meta_keywords TEXT[],

    -- Snapshot of GEO fields
    target_audience TEXT,
    key_topics TEXT[],
    faq_items JSONB,

    -- Snapshot of organization
    category VARCHAR(100),
    tags TEXT[],

    -- Snapshot of status at time of revision
    status_at_revision VARCHAR(20),

    -- Unique constraint: one revision number per article
    CONSTRAINT unique_article_revision UNIQUE (article_id, revision_number)
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

-- Most common query: get all revisions for an article
CREATE INDEX idx_revisions_article ON blog_article_revisions(article_id, revision_number DESC);

-- Filter by author (who made changes)
CREATE INDEX idx_revisions_author ON blog_article_revisions(created_by);

-- Search revisions by date
CREATE INDEX idx_revisions_created ON blog_article_revisions(created_at DESC);

-- =====================================================
-- Triggers
-- =====================================================

-- Auto-increment revision number for each article
CREATE OR REPLACE FUNCTION auto_increment_revision_number()
RETURNS TRIGGER AS $$
DECLARE
    max_revision INTEGER;
BEGIN
    -- Get the highest revision number for this article
    SELECT COALESCE(MAX(revision_number), 0) INTO max_revision
    FROM blog_article_revisions
    WHERE article_id = NEW.article_id;

    -- Set new revision number
    NEW.revision_number = max_revision + 1;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_increment_revision
    BEFORE INSERT ON blog_article_revisions
    FOR EACH ROW
    WHEN (NEW.revision_number IS NULL)
    EXECUTE FUNCTION auto_increment_revision_number();

-- Auto-create revision when article is updated
CREATE OR REPLACE FUNCTION create_revision_on_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create revision if substantive fields changed
    IF (OLD.title != NEW.title OR
        OLD.content != NEW.content OR
        OLD.excerpt != NEW.excerpt OR
        OLD.status != NEW.status OR
        COALESCE(OLD.meta_title, '') != COALESCE(NEW.meta_title, '') OR
        COALESCE(OLD.meta_description, '') != COALESCE(NEW.meta_description, '') OR
        COALESCE(OLD.meta_keywords, ARRAY[]::TEXT[]) != COALESCE(NEW.meta_keywords, ARRAY[]::TEXT[])) THEN

        -- Insert revision snapshot of OLD values
        INSERT INTO blog_article_revisions (
            article_id,
            created_by,
            title,
            slug,
            excerpt,
            content,
            featured_image,
            meta_title,
            meta_description,
            meta_keywords,
            target_audience,
            key_topics,
            faq_items,
            category,
            tags,
            status_at_revision,
            change_summary
        ) VALUES (
            OLD.id,
            NEW.author_id, -- Track who made the change
            OLD.title,
            OLD.slug,
            OLD.excerpt,
            OLD.content,
            OLD.featured_image,
            OLD.meta_title,
            OLD.meta_description,
            OLD.meta_keywords,
            OLD.target_audience,
            OLD.key_topics,
            OLD.faq_items,
            OLD.category,
            OLD.tags,
            OLD.status,
            'Auto-saved revision before update'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_revision_on_update
    AFTER UPDATE ON blog_articles
    FOR EACH ROW
    EXECUTE FUNCTION create_revision_on_update();

-- =====================================================
-- Functions for Revision Management
-- =====================================================

-- Function to restore article to a specific revision
CREATE OR REPLACE FUNCTION restore_article_revision(
    p_article_id UUID,
    p_revision_number INTEGER,
    p_restored_by UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_revision RECORD;
BEGIN
    -- Get the revision
    SELECT * INTO v_revision
    FROM blog_article_revisions
    WHERE article_id = p_article_id AND revision_number = p_revision_number;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Revision not found: article_id=%, revision_number=%', p_article_id, p_revision_number;
    END IF;

    -- Update article with revision data
    UPDATE blog_articles
    SET
        title = v_revision.title,
        slug = v_revision.slug,
        excerpt = v_revision.excerpt,
        content = v_revision.content,
        featured_image = v_revision.featured_image,
        meta_title = v_revision.meta_title,
        meta_description = v_revision.meta_description,
        meta_keywords = v_revision.meta_keywords,
        target_audience = v_revision.target_audience,
        key_topics = v_revision.key_topics,
        faq_items = v_revision.faq_items,
        category = v_revision.category,
        tags = v_revision.tags,
        author_id = p_restored_by,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_article_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to compare two revisions
CREATE OR REPLACE FUNCTION compare_article_revisions(
    p_article_id UUID,
    p_revision_1 INTEGER,
    p_revision_2 INTEGER
)
RETURNS TABLE (
    field_name TEXT,
    revision_1_value TEXT,
    revision_2_value TEXT,
    changed BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH r1 AS (
        SELECT * FROM blog_article_revisions
        WHERE article_id = p_article_id AND revision_number = p_revision_1
    ),
    r2 AS (
        SELECT * FROM blog_article_revisions
        WHERE article_id = p_article_id AND revision_number = p_revision_2
    )
    SELECT
        'title'::TEXT,
        r1.title::TEXT,
        r2.title::TEXT,
        (r1.title != r2.title)
    FROM r1, r2
    UNION ALL
    SELECT
        'content'::TEXT,
        LEFT(r1.content, 100)::TEXT,
        LEFT(r2.content, 100)::TEXT,
        (r1.content != r2.content)
    FROM r1, r2
    UNION ALL
    SELECT
        'excerpt'::TEXT,
        COALESCE(r1.excerpt, '')::TEXT,
        COALESCE(r2.excerpt, '')::TEXT,
        (COALESCE(r1.excerpt, '') != COALESCE(r2.excerpt, ''))
    FROM r1, r2;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE blog_article_revisions IS 'Version history for blog articles - enables rollback and change tracking';
COMMENT ON COLUMN blog_article_revisions.revision_number IS 'Auto-incrementing revision number per article (starts at 1)';
COMMENT ON COLUMN blog_article_revisions.change_summary IS 'Optional description of what changed in this revision';
COMMENT ON FUNCTION restore_article_revision IS 'Restore a blog article to a previous revision state';
COMMENT ON FUNCTION compare_article_revisions IS 'Compare two revisions to see what changed';

-- =====================================================
-- Rollback Script (save for reference)
-- =====================================================

-- To rollback this migration, run:
-- DROP FUNCTION IF EXISTS compare_article_revisions(UUID, INTEGER, INTEGER);
-- DROP FUNCTION IF EXISTS restore_article_revision(UUID, INTEGER, UUID);
-- DROP TRIGGER IF EXISTS trigger_create_revision_on_update ON blog_articles;
-- DROP TRIGGER IF EXISTS trigger_auto_increment_revision ON blog_article_revisions;
-- DROP FUNCTION IF EXISTS create_revision_on_update();
-- DROP FUNCTION IF EXISTS auto_increment_revision_number();
-- DROP TABLE IF EXISTS blog_article_revisions CASCADE;
