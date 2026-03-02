-- =============================================
-- Migration 032: Add clicked_at to outreach_emails
-- =============================================
-- The status field is progressive (sent→delivered→opened→clicked→replied)
-- and can regress when duplicate webhook events arrive. clicked_at is a
-- persistent timestamp that survives status changes, matching the pattern
-- already used by opened_at and replied_at.
-- =============================================

-- Add the column
ALTER TABLE outreach_emails ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMPTZ;

-- Backfill from email_events: set clicked_at for any email that has a click event
UPDATE outreach_emails e
SET clicked_at = ev.first_click
FROM (
  SELECT outreach_email_id, MIN(received_at) AS first_click
  FROM email_events
  WHERE event_type = 'click'
  GROUP BY outreach_email_id
) ev
WHERE e.id = ev.outreach_email_id
  AND e.clicked_at IS NULL;

-- Also set clicked_at for any email currently in 'clicked' status
UPDATE outreach_emails
SET clicked_at = COALESCE(opened_at, sent_at, NOW())
WHERE status = 'clicked'
  AND clicked_at IS NULL;
