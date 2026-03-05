-- =============================================
-- Migration 040: Fix lifecycle stages
-- =============================================
-- 1. Move all contacts with lifecycle_stage='replied' to 'cold'
-- 2. Check outreach_emails sent_at status for diagnosis
-- =============================================

-- Move all 'replied' contacts to 'cold'
UPDATE contacts SET lifecycle_stage = 'cold' WHERE lifecycle_stage = 'replied';

-- Check: how many contacts per lifecycle stage now?
SELECT lifecycle_stage, COUNT(*) as cnt FROM contacts GROUP BY lifecycle_stage ORDER BY cnt DESC;

-- Check: do outreach_emails have sent_at populated?
SELECT
    COUNT(*) as total_emails,
    COUNT(sent_at) as has_sent_at,
    COUNT(*) - COUNT(sent_at) as missing_sent_at
FROM outreach_emails;

-- Check: how many prospects have emails but no sent_at?
SELECT COUNT(DISTINCT oe.prospect_id) as prospects_with_emails_no_sent_at
FROM outreach_emails oe
WHERE oe.sent_at IS NULL AND oe.prospect_id IS NOT NULL;
