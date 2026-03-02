-- Migration: Increase email limit to 200
-- Date: 2026-02-05
-- Changes daily email limit from 75 to 200

-- Update daily email limit to 200
UPDATE outreach_settings
SET value = '200'
WHERE key = 'max_emails_per_day';

-- Verify the change
SELECT key, value FROM outreach_settings WHERE key = 'max_emails_per_day';
