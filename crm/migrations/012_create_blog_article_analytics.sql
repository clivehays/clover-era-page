-- =====================================================
-- Migration: 012_create_blog_article_analytics
-- Description: Create analytics tracking table for blog articles
-- Date: 2025-11-12
-- =====================================================

-- Create blog_article_analytics table
CREATE TABLE IF NOT EXISTS blog_article_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Link to article
    article_id UUID NOT NULL REFERENCES blog_articles(id) ON DELETE CASCADE,

    -- Time dimension (daily aggregation)
    date DATE NOT NULL,

    -- View metrics
    page_views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,

    -- Engagement metrics
    avg_time_on_page INTEGER DEFAULT 0, -- seconds
    bounce_rate DECIMAL(5,2) DEFAULT 0.00, -- percentage
    scroll_depth_avg INTEGER DEFAULT 0, -- percentage (0-100)

    -- Traffic sources
    source_direct INTEGER DEFAULT 0,
    source_organic INTEGER DEFAULT 0,
    source_social INTEGER DEFAULT 0,
    source_referral INTEGER DEFAULT 0,
    source_email INTEGER DEFAULT 0,

    -- Search engines (organic traffic breakdown)
    search_google INTEGER DEFAULT 0,
    search_bing INTEGER DEFAULT 0,
    search_other INTEGER DEFAULT 0,

    -- AI/GEO traffic sources (Generative Engine Optimization)
    ai_chatgpt INTEGER DEFAULT 0,
    ai_perplexity INTEGER DEFAULT 0,
    ai_gemini INTEGER DEFAULT 0,
    ai_other INTEGER DEFAULT 0,

    -- Social media breakdown
    social_linkedin INTEGER DEFAULT 0,
    social_twitter INTEGER DEFAULT 0,
    social_facebook INTEGER DEFAULT 0,
    social_other INTEGER DEFAULT 0,

    -- Device breakdown
    device_desktop INTEGER DEFAULT 0,
    device_mobile INTEGER DEFAULT 0,
    device_tablet INTEGER DEFAULT 0,

    -- Conversion tracking
    cta_clicks INTEGER DEFAULT 0, -- Call-to-action clicks
    trial_signups INTEGER DEFAULT 0,
    contact_form_submissions INTEGER DEFAULT 0,

    -- Geographic data (top countries, stored as JSONB)
    geo_countries JSONB, -- {"US": 45, "UK": 23, "CA": 18, ...}

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

    -- Unique constraint: one record per article per day
    CONSTRAINT unique_article_date UNIQUE (article_id, date)
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

-- Most common query: analytics for a specific article
CREATE INDEX idx_analytics_article ON blog_article_analytics(article_id, date DESC);

-- Date range queries
CREATE INDEX idx_analytics_date ON blog_article_analytics(date DESC);

-- Combined index for article + date range
CREATE INDEX idx_analytics_article_date ON blog_article_analytics(article_id, date);

-- Page views ranking
CREATE INDEX idx_analytics_views ON blog_article_analytics(page_views DESC);

-- =====================================================
-- Triggers
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_analytics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_analytics_updated_at
    BEFORE UPDATE ON blog_article_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_analytics_updated_at();

-- Update article view_count when analytics are updated
CREATE OR REPLACE FUNCTION sync_article_view_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update total view count on the article
    UPDATE blog_articles
    SET view_count = (
        SELECT COALESCE(SUM(page_views), 0)
        FROM blog_article_analytics
        WHERE article_id = NEW.article_id
    )
    WHERE id = NEW.article_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_view_count
    AFTER INSERT OR UPDATE OF page_views ON blog_article_analytics
    FOR EACH ROW
    EXECUTE FUNCTION sync_article_view_count();

-- =====================================================
-- Views for Reporting
-- =====================================================

-- View: Article performance summary (last 30 days)
CREATE OR REPLACE VIEW blog_article_performance_30d AS
SELECT
    a.id,
    a.title,
    a.slug,
    a.published_at,
    a.category,
    COALESCE(SUM(an.page_views), 0) AS total_views,
    COALESCE(SUM(an.unique_visitors), 0) AS total_unique_visitors,
    COALESCE(AVG(an.avg_time_on_page), 0)::INTEGER AS avg_time_on_page,
    COALESCE(AVG(an.bounce_rate), 0) AS avg_bounce_rate,
    COALESCE(SUM(an.cta_clicks), 0) AS total_cta_clicks,
    COALESCE(SUM(an.trial_signups), 0) AS total_trial_signups,
    COUNT(DISTINCT an.date) AS days_tracked
FROM blog_articles a
LEFT JOIN blog_article_analytics an ON a.id = an.article_id
    AND an.date >= CURRENT_DATE - INTERVAL '30 days'
WHERE a.status = 'published'
GROUP BY a.id, a.title, a.slug, a.published_at, a.category
ORDER BY total_views DESC;

-- View: Traffic source summary (last 30 days)
CREATE OR REPLACE VIEW blog_traffic_sources_30d AS
SELECT
    article_id,
    SUM(source_direct) AS direct,
    SUM(source_organic) AS organic,
    SUM(source_social) AS social,
    SUM(source_referral) AS referral,
    SUM(source_email) AS email,
    SUM(search_google + search_bing + search_other) AS total_search,
    SUM(ai_chatgpt + ai_perplexity + ai_gemini + ai_other) AS total_ai,
    SUM(page_views) AS total_views
FROM blog_article_analytics
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY article_id;

-- View: Top performing articles by AI traffic
CREATE OR REPLACE VIEW blog_top_ai_traffic AS
SELECT
    a.id,
    a.title,
    a.slug,
    SUM(an.ai_chatgpt) AS chatgpt_views,
    SUM(an.ai_perplexity) AS perplexity_views,
    SUM(an.ai_gemini) AS gemini_views,
    SUM(an.ai_other) AS other_ai_views,
    SUM(an.ai_chatgpt + an.ai_perplexity + an.ai_gemini + an.ai_other) AS total_ai_views,
    ROUND(
        (SUM(an.ai_chatgpt + an.ai_perplexity + an.ai_gemini + an.ai_other)::DECIMAL /
        NULLIF(SUM(an.page_views), 0) * 100), 2
    ) AS ai_traffic_percentage
FROM blog_articles a
LEFT JOIN blog_article_analytics an ON a.id = an.article_id
    AND an.date >= CURRENT_DATE - INTERVAL '30 days'
WHERE a.status = 'published'
GROUP BY a.id, a.title, a.slug
HAVING SUM(an.ai_chatgpt + an.ai_perplexity + an.ai_gemini + an.ai_other) > 0
ORDER BY total_ai_views DESC;

-- =====================================================
-- Functions for Analytics
-- =====================================================

-- Function to record a page view
CREATE OR REPLACE FUNCTION record_article_view(
    p_article_id UUID,
    p_source VARCHAR(50) DEFAULT 'direct',
    p_device VARCHAR(20) DEFAULT 'desktop',
    p_referrer VARCHAR(255) DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_date DATE := CURRENT_DATE;
    v_ai_source VARCHAR(50);
BEGIN
    -- Detect AI source from referrer
    v_ai_source := CASE
        WHEN p_referrer ILIKE '%chat.openai.com%' OR p_referrer ILIKE '%chatgpt%' THEN 'chatgpt'
        WHEN p_referrer ILIKE '%perplexity%' THEN 'perplexity'
        WHEN p_referrer ILIKE '%gemini%' OR p_referrer ILIKE '%bard.google%' THEN 'gemini'
        WHEN p_source = 'ai' THEN 'other'
        ELSE NULL
    END;

    -- Insert or update analytics record
    INSERT INTO blog_article_analytics (
        article_id,
        date,
        page_views,
        source_direct,
        source_organic,
        source_social,
        source_referral,
        source_email,
        device_desktop,
        device_mobile,
        device_tablet,
        ai_chatgpt,
        ai_perplexity,
        ai_gemini,
        ai_other
    ) VALUES (
        p_article_id,
        v_date,
        1,
        CASE WHEN p_source = 'direct' THEN 1 ELSE 0 END,
        CASE WHEN p_source = 'organic' THEN 1 ELSE 0 END,
        CASE WHEN p_source = 'social' THEN 1 ELSE 0 END,
        CASE WHEN p_source = 'referral' THEN 1 ELSE 0 END,
        CASE WHEN p_source = 'email' THEN 1 ELSE 0 END,
        CASE WHEN p_device = 'desktop' THEN 1 ELSE 0 END,
        CASE WHEN p_device = 'mobile' THEN 1 ELSE 0 END,
        CASE WHEN p_device = 'tablet' THEN 1 ELSE 0 END,
        CASE WHEN v_ai_source = 'chatgpt' THEN 1 ELSE 0 END,
        CASE WHEN v_ai_source = 'perplexity' THEN 1 ELSE 0 END,
        CASE WHEN v_ai_source = 'gemini' THEN 1 ELSE 0 END,
        CASE WHEN v_ai_source = 'other' THEN 1 ELSE 0 END
    )
    ON CONFLICT (article_id, date)
    DO UPDATE SET
        page_views = blog_article_analytics.page_views + 1,
        source_direct = blog_article_analytics.source_direct + EXCLUDED.source_direct,
        source_organic = blog_article_analytics.source_organic + EXCLUDED.source_organic,
        source_social = blog_article_analytics.source_social + EXCLUDED.source_social,
        source_referral = blog_article_analytics.source_referral + EXCLUDED.source_referral,
        source_email = blog_article_analytics.source_email + EXCLUDED.source_email,
        device_desktop = blog_article_analytics.device_desktop + EXCLUDED.device_desktop,
        device_mobile = blog_article_analytics.device_mobile + EXCLUDED.device_mobile,
        device_tablet = blog_article_analytics.device_tablet + EXCLUDED.device_tablet,
        ai_chatgpt = blog_article_analytics.ai_chatgpt + EXCLUDED.ai_chatgpt,
        ai_perplexity = blog_article_analytics.ai_perplexity + EXCLUDED.ai_perplexity,
        ai_gemini = blog_article_analytics.ai_gemini + EXCLUDED.ai_gemini,
        ai_other = blog_article_analytics.ai_other + EXCLUDED.ai_other,
        updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Function to get article analytics summary
CREATE OR REPLACE FUNCTION get_article_analytics_summary(
    p_article_id UUID,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    total_views BIGINT,
    unique_visitors BIGINT,
    avg_time_seconds INTEGER,
    avg_bounce_rate DECIMAL,
    total_conversions BIGINT,
    top_source TEXT,
    top_device TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(an.page_views), 0)::BIGINT,
        COALESCE(SUM(an.unique_visitors), 0)::BIGINT,
        COALESCE(AVG(an.avg_time_on_page), 0)::INTEGER,
        COALESCE(AVG(an.bounce_rate), 0),
        COALESCE(SUM(an.trial_signups + an.contact_form_submissions), 0)::BIGINT,
        (
            SELECT
                CASE
                    WHEN MAX(source_organic) >= MAX(source_direct) AND MAX(source_organic) >= MAX(source_social) THEN 'organic'
                    WHEN MAX(source_social) >= MAX(source_direct) THEN 'social'
                    ELSE 'direct'
                END
            FROM blog_article_analytics
            WHERE article_id = p_article_id
                AND date >= CURRENT_DATE - p_days
        ),
        (
            SELECT
                CASE
                    WHEN MAX(device_mobile) >= MAX(device_desktop) THEN 'mobile'
                    ELSE 'desktop'
                END
            FROM blog_article_analytics
            WHERE article_id = p_article_id
                AND date >= CURRENT_DATE - p_days
        )
    FROM blog_article_analytics an
    WHERE an.article_id = p_article_id
        AND an.date >= CURRENT_DATE - p_days;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE blog_article_analytics IS 'Daily analytics tracking for blog articles with AI/GEO traffic sources';
COMMENT ON COLUMN blog_article_analytics.ai_chatgpt IS 'Page views from ChatGPT (Generative Engine Optimization tracking)';
COMMENT ON COLUMN blog_article_analytics.ai_perplexity IS 'Page views from Perplexity AI (Generative Engine Optimization tracking)';
COMMENT ON COLUMN blog_article_analytics.ai_gemini IS 'Page views from Google Gemini (Generative Engine Optimization tracking)';
COMMENT ON FUNCTION record_article_view IS 'Record a page view with source tracking (auto-detects AI sources)';
COMMENT ON VIEW blog_top_ai_traffic IS 'Top performing articles ranked by AI engine traffic (GEO effectiveness)';

-- =====================================================
-- Rollback Script (save for reference)
-- =====================================================

-- To rollback this migration, run:
-- DROP VIEW IF EXISTS blog_top_ai_traffic;
-- DROP VIEW IF EXISTS blog_traffic_sources_30d;
-- DROP VIEW IF EXISTS blog_article_performance_30d;
-- DROP FUNCTION IF EXISTS get_article_analytics_summary(UUID, INTEGER);
-- DROP FUNCTION IF EXISTS record_article_view(UUID, VARCHAR, VARCHAR, VARCHAR);
-- DROP TRIGGER IF EXISTS trigger_sync_view_count ON blog_article_analytics;
-- DROP TRIGGER IF EXISTS trigger_analytics_updated_at ON blog_article_analytics;
-- DROP FUNCTION IF EXISTS sync_article_view_count();
-- DROP FUNCTION IF EXISTS update_analytics_updated_at();
-- DROP TABLE IF EXISTS blog_article_analytics CASCADE;
