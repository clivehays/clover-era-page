-- =============================================
-- Migration 037: Exclude Book Launch Bulk List from Pipeline
-- =============================================
-- 7,094 prospects imported on 2026-02-06 are from the book launch
-- bulk email list. These are not sales prospects and should not
-- appear in the People pipeline.
-- =============================================

-- 1. Mark bulk import prospects as 'unsubscribed'
-- Feb 06 (7094), Jan 27 (779), Feb 11 (337)
-- Only affects passive statuses. Does NOT touch replied or converted.
UPDATE outreach_prospects
SET status = 'unsubscribed'
WHERE (
    (created_at >= '2026-02-06' AND created_at < '2026-02-07')
    OR (created_at >= '2026-01-27' AND created_at < '2026-01-28')
    OR (created_at >= '2026-02-11' AND created_at < '2026-02-12')
)
AND status IN ('imported', 'pending', 'ready', 'active', 'completed');

-- 2. VERIFY
SELECT status, COUNT(*) as count
FROM outreach_prospects
GROUP BY status
ORDER BY count DESC;
