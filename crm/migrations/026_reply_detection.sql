-- Reply Detection Schema
-- Migration: 026_reply_detection.sql
-- Date: 2026-02-05
-- Description: Creates table to track processed reply emails and prevent duplicates

-- =============================================
-- PROCESSED REPLY EMAILS TABLE
-- =============================================
-- Tracks which emails have been processed by the reply detection system
-- Prevents duplicate processing on subsequent cron runs

CREATE TABLE IF NOT EXISTS processed_reply_emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_id TEXT NOT NULL UNIQUE,  -- Microsoft Graph email ID
    prospect_id UUID REFERENCES outreach_prospects(id) ON DELETE SET NULL,
    result TEXT NOT NULL CHECK (result IN ('converted', 'no_match', 'error', 'skipped')),
    processed_at TIMESTAMPTZ DEFAULT NOW(),

    -- Index for quick lookups
    CONSTRAINT unique_email_id UNIQUE (email_id)
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_processed_reply_emails_email_id ON processed_reply_emails(email_id);
CREATE INDEX IF NOT EXISTS idx_processed_reply_emails_prospect_id ON processed_reply_emails(prospect_id);
CREATE INDEX IF NOT EXISTS idx_processed_reply_emails_processed_at ON processed_reply_emails(processed_at);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE processed_reply_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users full access to processed_reply_emails"
    ON processed_reply_emails FOR ALL TO authenticated
    USING (true) WITH CHECK (true);

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE processed_reply_emails IS 'Tracks emails processed by the reply detection system to prevent duplicates';
COMMENT ON COLUMN processed_reply_emails.email_id IS 'Microsoft Graph unique email identifier';
COMMENT ON COLUMN processed_reply_emails.result IS 'Result of processing: converted (created CRM records), no_match (sender not a prospect), error, skipped';
