-- =============================================
-- Migration 036: Fix Status Constraint + Backfill Clicks
-- =============================================
-- ROOT CAUSE: The CHECK constraint on outreach_emails.status does not
-- include 'clicked' (or 'sending', 'pending_followup'). This means
-- the Resend webhook has NEVER been able to record clicks because
-- setting status='clicked' violates the constraint.
--
-- Fix: Drop old constraint, add new one with all valid statuses.
-- Then backfill clicked_at from the Resend CSV export.
-- =============================================

-- 1. Fix the CHECK constraint to include all statuses used by the system
ALTER TABLE outreach_emails DROP CONSTRAINT IF EXISTS outreach_emails_status_check;

ALTER TABLE outreach_emails ADD CONSTRAINT outreach_emails_status_check
  CHECK (status IN (
    'draft',
    'approved',
    'pending_followup',
    'scheduled',
    'sending',
    'sent',
    'delivered',
    'opened',
    'clicked',
    'replied',
    'bounced',
    'failed'
  ));

-- 2. Backfill clicked_at and status for emails matched by Resend ID
UPDATE outreach_emails
SET
    clicked_at = COALESCE(clicked_at, sent_at),
    opened_at = COALESCE(opened_at, sent_at),
    status = CASE WHEN status NOT IN ('replied') THEN 'clicked' ELSE status END
WHERE sendgrid_message_id IN (
    'c8ece73b-6175-4a42-9225-4d07dd7a13ce',
    '3c04e615-e906-45d7-a1cb-247ed2dbcce1',
    'f1c9119a-e66f-4a4e-8e9a-c36c60967aa6',
    'da2a0d9b-2bff-458c-8cea-8662c2da264d',
    'aa7501f0-9818-4d8f-8091-20288d3e408b',
    '502a0d09-9e7a-441a-ae97-3521e84dc04a',
    'e4da8def-7e3e-4e3e-bebf-1d850a03b0aa',
    'd4e4edd4-be6d-44cd-8871-9b7418bcbe15',
    'e18243b7-a6e8-4d1e-95de-1db3c51bd661',
    'a93a6db7-0cc8-4e4d-a508-dfccc79c6c33',
    'fd1b6afb-b9f9-4093-9461-43cc602c02c1',
    'e4cdc263-bb14-4ef1-b535-f66d25e8cae5',
    'bdf03003-b93d-4b2f-835b-09944919f513',
    '7e722e5f-08fd-484b-ae63-93fb13e6a916',
    '7e9be3a1-612a-4281-ba25-b0a064ef2da3',
    '7a70bfea-03bc-4eb1-9073-fff316df9c1c',
    '3d2954a8-3b97-4220-af4f-43e2070f27f8',
    'fee653a1-a9e0-4f39-8c90-37e8b1b5cbbd',
    '59f40b65-1e40-49de-84df-01e15b3f390e',
    '2d978924-d70c-433c-9ece-5590b1ae632c',
    '5a4c2364-9ee4-46ee-94fd-880feca1e997',
    '09ffcb25-da35-485d-9161-74145f9cc664',
    '35a30bfc-ac0f-4cf0-899a-ae9b329e71fd',
    '1d00fbf7-79d0-4d4e-8f8b-e3ab490fb8fc',
    'c86bb4e0-dad7-416c-800a-081469d00f2e',
    'c054926d-bb74-4257-848e-7b50310f30ff',
    '62680059-bacb-480d-82c7-a3ee797bc146',
    '3d25243f-81fe-4183-a435-a0c0df7b4537',
    'c588c9be-aa3d-42f7-8ca9-7fa17196e0ac',
    '6f6a9f9d-0412-426a-af44-14575080c8d8',
    '9153ebe7-a6c4-45f8-b69c-7b863c57d4b7',
    'dfb55cd2-7f5d-490f-970b-b22e9749af71',
    'c8d3cf31-5ab0-4928-8a83-58b16ee9dceb'
)
AND clicked_at IS NULL;

-- 3. VERIFY
SELECT
    COUNT(*) FILTER (WHERE clicked_at IS NOT NULL) as clicked_count,
    COUNT(*) FILTER (WHERE opened_at IS NOT NULL) as opened_count,
    COUNT(*) as total_matched
FROM outreach_emails
WHERE sendgrid_message_id IN (
    'c8ece73b-6175-4a42-9225-4d07dd7a13ce',
    '3c04e615-e906-45d7-a1cb-247ed2dbcce1',
    'f1c9119a-e66f-4a4e-8e9a-c36c60967aa6',
    'da2a0d9b-2bff-458c-8cea-8662c2da264d',
    'aa7501f0-9818-4d8f-8091-20288d3e408b',
    '502a0d09-9e7a-441a-ae97-3521e84dc04a',
    'e4da8def-7e3e-4e3e-bebf-1d850a03b0aa',
    'd4e4edd4-be6d-44cd-8871-9b7418bcbe15',
    'e18243b7-a6e8-4d1e-95de-1db3c51bd661',
    'a93a6db7-0cc8-4e4d-a508-dfccc79c6c33',
    'fd1b6afb-b9f9-4093-9461-43cc602c02c1',
    'e4cdc263-bb14-4ef1-b535-f66d25e8cae5',
    'bdf03003-b93d-4b2f-835b-09944919f513',
    '7e722e5f-08fd-484b-ae63-93fb13e6a916',
    '7e9be3a1-612a-4281-ba25-b0a064ef2da3',
    '7a70bfea-03bc-4eb1-9073-fff316df9c1c',
    '3d2954a8-3b97-4220-af4f-43e2070f27f8',
    'fee653a1-a9e0-4f39-8c90-37e8b1b5cbbd',
    '59f40b65-1e40-49de-84df-01e15b3f390e',
    '2d978924-d70c-433c-9ece-5590b1ae632c',
    '5a4c2364-9ee4-46ee-94fd-880feca1e997',
    '09ffcb25-da35-485d-9161-74145f9cc664',
    '35a30bfc-ac0f-4cf0-899a-ae9b329e71fd',
    '1d00fbf7-79d0-4d4e-8f8b-e3ab490fb8fc',
    'c86bb4e0-dad7-416c-800a-081469d00f2e',
    'c054926d-bb74-4257-848e-7b50310f30ff',
    '62680059-bacb-480d-82c7-a3ee797bc146',
    '3d25243f-81fe-4183-a435-a0c0df7b4537',
    'c588c9be-aa3d-42f7-8ca9-7fa17196e0ac',
    '6f6a9f9d-0412-426a-af44-14575080c8d8',
    '9153ebe7-a6c4-45f8-b69c-7b863c57d4b7',
    'dfb55cd2-7f5d-490f-970b-b22e9749af71',
    'c8d3cf31-5ab0-4928-8a83-58b16ee9dceb'
);
