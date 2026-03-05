-- =============================================
-- Migration 037: Exclude Book Launch Bulk List from Pipeline
-- =============================================
-- ~8,000 prospects from the book launch broadcast campaign
-- (tag: "book-launch-extra-feb-2026") are inflating the People
-- pipeline. These are a bulk email list, not sales prospects.
-- Mark them as 'unsubscribed' so they're excluded from People queries.
-- =============================================

-- 1. First, find the campaign(s) - run this to verify before the update
SELECT c.id, c.name, c.campaign_type, c.status,
       COUNT(cp.id) as prospect_count
FROM outreach_campaigns c
LEFT JOIN campaign_prospects cp ON cp.campaign_id = c.id
WHERE c.name ILIKE '%book%launch%'
   OR c.name ILIKE '%book-launch-extra%'
   OR c.name ILIKE '%already%gone%'
   OR c.campaign_type = 'broadcast'
GROUP BY c.id, c.name, c.campaign_type, c.status
ORDER BY prospect_count DESC;

-- 2. Mark all prospects from broadcast campaigns as 'unsubscribed'
-- so they're excluded from the People page pipeline.
-- Only affects prospects that are still in passive states (imported/pending/ready/active/completed).
-- Does NOT touch prospects that have replied or been converted.
UPDATE outreach_prospects
SET status = 'unsubscribed'
WHERE id IN (
    SELECT cp.prospect_id
    FROM campaign_prospects cp
    JOIN outreach_campaigns c ON c.id = cp.campaign_id
    WHERE c.campaign_type = 'broadcast'
)
AND status IN ('imported', 'pending', 'ready', 'active', 'completed');

-- 3. VERIFY: count remaining pipeline
SELECT
    COUNT(*) FILTER (WHERE status NOT IN ('converted','bounced','invalid','unsubscribed')) as in_pipeline,
    COUNT(*) FILTER (WHERE status = 'unsubscribed') as excluded,
    COUNT(*) as total
FROM outreach_prospects;
