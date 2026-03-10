-- =============================================
-- Migration 049: Strip PDF attachments from C-Suite Cold Email 1
-- =============================================
-- Removes attachment_url and attachment_name from personalization_notes
-- for all Email 1 (position 1) drafts in the C-Suite Cold sequence.
-- This prevents the send function from attaching PDFs.
-- =============================================

-- Strip attachment fields from all C-Suite Cold Email 1s that haven't been sent yet
UPDATE outreach_emails
SET personalization_notes = (
  personalization_notes::jsonb
  - 'attachment_url'
  - 'attachment_name'
  - 'attachment'
)::text
WHERE position = 1
  AND status NOT IN ('sent', 'failed')
  AND sequence_id = (SELECT id FROM outreach_sequences WHERE name = 'C-Suite Cold - Report Turnover Cost')
  AND personalization_notes IS NOT NULL
  AND (
    personalization_notes::jsonb ? 'attachment_url'
    OR personalization_notes::jsonb ? 'attachment_name'
    OR personalization_notes::jsonb ? 'attachment'
  );

-- Verify: show remaining attachment fields (should be 0 rows)
SELECT id, position, status,
       personalization_notes::jsonb ? 'attachment_url' as has_attachment_url,
       personalization_notes::jsonb ? 'attachment_name' as has_attachment_name
FROM outreach_emails
WHERE position = 1
  AND sequence_id = (SELECT id FROM outreach_sequences WHERE name = 'C-Suite Cold - Report Turnover Cost')
  AND status NOT IN ('sent', 'failed')
  AND (
    personalization_notes::jsonb ? 'attachment_url'
    OR personalization_notes::jsonb ? 'attachment_name'
    OR personalization_notes::jsonb ? 'attachment'
  );
