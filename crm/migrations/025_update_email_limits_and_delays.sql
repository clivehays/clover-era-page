-- Migration: Update email limits and delays
-- Changes:
--   1. Daily limit: 50 -> 75
--   2. Email 2 delay: 3 days -> 2 days
--   3. Email 3 delay: 3 days -> 2 days (4 days total from Email 1)

-- Update daily email limit to 75
UPDATE outreach_settings
SET value = '75'
WHERE key = 'max_emails_per_day';

-- If the setting doesn't exist, insert it
INSERT INTO outreach_settings (key, value)
SELECT 'max_emails_per_day', '75'
WHERE NOT EXISTS (
    SELECT 1 FROM outreach_settings WHERE key = 'max_emails_per_day'
);

-- Update sequence templates to use 2-day delays
-- Email 2 (position 2): 2 days after Email 1
-- Email 3 (position 3): 2 days after Email 2 (4 days total)
UPDATE sequence_templates
SET days_delay = 2
WHERE position IN (2, 3);

-- Verify the changes
SELECT 'Settings' as table_name, key, value FROM outreach_settings WHERE key = 'max_emails_per_day'
UNION ALL
SELECT 'Templates' as table_name, 'position_' || position::text, days_delay::text FROM sequence_templates WHERE position > 1;
