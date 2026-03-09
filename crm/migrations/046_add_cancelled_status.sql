-- =============================================
-- Migration 046: Add 'cancelled' status to outreach_emails
-- =============================================
-- Needed for reply tracking: when a prospect replies,
-- remaining follow-up emails should be cancelled.
-- =============================================

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
    'failed',
    'cancelled'
  ));
