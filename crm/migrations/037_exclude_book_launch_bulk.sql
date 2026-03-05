-- =============================================
-- Migration 037: Exclude Book Launch Bulk List from Pipeline
-- =============================================
-- 7,094 prospects imported on 2026-02-06 are from the book launch
-- bulk email list. These are not sales prospects and should not
-- appear in the People pipeline.
-- =============================================

-- 1. Mark all prospects imported on 2026-02-06 as 'unsubscribed'
-- Only affects passive statuses. Does NOT touch replied or converted.
UPDATE outreach_prospects
SET status = 'unsubscribed'
WHERE created_at >= '2026-02-06 00:00:00+00'
  AND created_at < '2026-02-07 00:00:00+00'
  AND status IN ('imported', 'pending', 'ready', 'active', 'completed');

-- 2. VERIFY
SELECT status, COUNT(*) as count
FROM outreach_prospects
GROUP BY status
ORDER BY count DESC;
