-- =====================================================
-- Migration: 013_add_author_name_to_blog_articles
-- Description: Add author_name field to blog_articles table
-- Date: 2025-11-21
-- =====================================================

-- Add author_name column
ALTER TABLE blog_articles
ADD COLUMN IF NOT EXISTS author_name VARCHAR(255);

-- Set default value for existing articles
UPDATE blog_articles
SET author_name = 'Clover ERA Team'
WHERE author_name IS NULL;

-- Add comment
COMMENT ON COLUMN blog_articles.author_name IS 'Display name of the article author';

-- =====================================================
-- Rollback Script
-- =====================================================
-- To rollback this migration, run:
-- ALTER TABLE blog_articles DROP COLUMN IF EXISTS author_name;
