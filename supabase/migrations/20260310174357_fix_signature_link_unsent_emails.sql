-- =============================================
-- Fix signature link in all unsent Nuc 003 Cold emails
-- Replace plain "cloverera.com" with linked version pointing to /67
-- Only updates emails that haven't been sent yet
-- =============================================

UPDATE outreach_emails
SET body = REPLACE(
      body,
      'cloverera.com</p>',
      '<a href="https://cloverera.com/67" style="color:#1a1a1a; text-decoration:none;">cloverera.com</a></p>'
    )
WHERE sequence_id = (SELECT id FROM outreach_sequences WHERE name = 'Nuc 003 Cold')
  AND status IN ('draft', 'approved', 'pending_followup', 'scheduled')
  AND body LIKE '%cloverera.com</p>%';

-- Verify
SELECT status, COUNT(*) as count,
       SUM(CASE WHEN body LIKE '%href="https://cloverera.com/67"%' THEN 1 ELSE 0 END) as updated
FROM outreach_emails
WHERE sequence_id = (SELECT id FROM outreach_sequences WHERE name = 'Nuc 003 Cold')
  AND status IN ('draft', 'approved', 'pending_followup', 'scheduled')
GROUP BY status;
