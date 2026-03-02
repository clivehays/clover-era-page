-- =============================================
-- Migration 033: Fix clicked_at backfill
-- =============================================
-- Migration 032 backfilled clicked_at from email_events, but that
-- included automated security scanner clicks (SafeLinks, Google link
-- prefetch, etc.) which are not real human clicks. Clear the bad data.
-- The webhook now sets clicked_at on real click events going forward.
-- =============================================

-- Clear all backfilled clicked_at values
UPDATE outreach_emails SET clicked_at = NULL WHERE clicked_at IS NOT NULL;

-- Only restore clicked_at for emails whose current status is 'clicked'
-- (these are confirmed real clicks that survived status progression)
UPDATE outreach_emails
SET clicked_at = COALESCE(opened_at, sent_at, NOW())
WHERE status = 'clicked'
  AND clicked_at IS NULL;
