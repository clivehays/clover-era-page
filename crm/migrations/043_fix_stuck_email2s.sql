-- Fix 4 Email 2s stuck in 'approved' status
-- These failed due to Resend rate limit, were re-approved,
-- but "Send Approved" only handles position 1 emails.
-- This reschedules them for immediate sending.

-- First, check what we're dealing with:
SELECT id, prospect_id, position, status, subject, scheduled_at, sent_at
FROM outreach_emails
WHERE status = 'approved' AND position > 1;

-- Fix: set them to 'scheduled' with scheduled_at = now so the cron picks them up
UPDATE outreach_emails
SET status = 'scheduled',
    scheduled_at = NOW()
WHERE status = 'approved'
  AND position > 1;
