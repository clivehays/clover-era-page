-- Outreach Prospects Schema - Separates outreach from CRM
-- Migration: 022_outreach_prospects.sql
-- Date: 2026-01-27
-- Description: Creates separate tables for outreach prospects (high volume)
--              vs CRM contacts (low volume, only when someone replies)

-- =============================================
-- OUTREACH PROSPECTS TABLE
-- =============================================
-- Denormalized table for CSV imports - company info stored inline
-- These are cold prospects, NOT qualified leads

CREATE TABLE outreach_prospects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Contact info
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  title TEXT,
  linkedin_url TEXT,

  -- Company info (denormalized - no FK to companies table)
  company_name TEXT,
  company_website TEXT,
  company_industry TEXT,
  company_employee_count INTEGER,

  -- Import tracking
  import_batch TEXT,
  imported_at TIMESTAMPTZ DEFAULT NOW(),

  -- Status tracking
  status TEXT DEFAULT 'imported' CHECK (status IN (
    'imported',     -- Just imported, not in any campaign
    'pending',      -- Added to campaign, awaiting research
    'researching',  -- Research in progress
    'ready',        -- Emails generated, ready to send
    'active',       -- Email sequence in progress
    'completed',    -- All emails sent, no reply
    'replied',      -- Got a reply
    'converted',    -- Converted to CRM contact
    'bounced',      -- Email bounced
    'unsubscribed', -- Opted out
    'invalid'       -- Bad email
  )),

  -- Conversion tracking (populated when converted to CRM)
  converted_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  converted_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Email must be unique
  UNIQUE(email)
);

-- =============================================
-- CAMPAIGN PROSPECTS TABLE
-- =============================================
-- Links prospects to campaigns (separate from campaign_contacts which links CRM contacts)

CREATE TABLE campaign_prospects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES outreach_campaigns(id) ON DELETE CASCADE,
  prospect_id UUID REFERENCES outreach_prospects(id) ON DELETE CASCADE,

  -- Progress tracking (same fields as campaign_contacts)
  current_step INTEGER DEFAULT 0, -- 0 = not started, 1-3 = email position
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Not yet started
    'researching',  -- Research in progress
    'ready',        -- Emails generated, ready to send
    'active',       -- Sequence in progress
    'completed',    -- All emails sent, no reply
    'replied',      -- Got a reply
    'bounced',      -- Email bounced
    'unsubscribed', -- Opted out
    'paused'        -- Manually paused
  )),

  added_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(campaign_id, prospect_id)
);

-- =============================================
-- MODIFY PROSPECT_RESEARCH
-- =============================================
-- Add prospect_id column to support both contacts and prospects

ALTER TABLE prospect_research
  ADD COLUMN prospect_id UUID REFERENCES outreach_prospects(id) ON DELETE CASCADE;

-- =============================================
-- MODIFY OUTREACH_EMAILS
-- =============================================
-- Add prospect columns, make contact columns nullable

ALTER TABLE outreach_emails
  ADD COLUMN campaign_prospect_id UUID REFERENCES campaign_prospects(id) ON DELETE CASCADE,
  ADD COLUMN prospect_id UUID REFERENCES outreach_prospects(id) ON DELETE CASCADE;

-- Make contact columns nullable (for prospect-based emails)
ALTER TABLE outreach_emails
  ALTER COLUMN contact_id DROP NOT NULL;

-- Note: campaign_contact_id is already nullable in original schema

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_outreach_prospects_email ON outreach_prospects(email);
CREATE INDEX idx_outreach_prospects_batch ON outreach_prospects(import_batch);
CREATE INDEX idx_outreach_prospects_status ON outreach_prospects(status);
CREATE INDEX idx_outreach_prospects_company ON outreach_prospects(company_name);

CREATE INDEX idx_campaign_prospects_campaign ON campaign_prospects(campaign_id);
CREATE INDEX idx_campaign_prospects_prospect ON campaign_prospects(prospect_id);
CREATE INDEX idx_campaign_prospects_status ON campaign_prospects(status);

CREATE INDEX idx_prospect_research_prospect ON prospect_research(prospect_id);
CREATE INDEX idx_outreach_emails_prospect ON outreach_emails(prospect_id);
CREATE INDEX idx_outreach_emails_campaign_prospect ON outreach_emails(campaign_prospect_id);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE outreach_prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_prospects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users full access to outreach_prospects"
  ON outreach_prospects FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to campaign_prospects"
  ON campaign_prospects FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- =============================================
-- UPDATE HELPER FUNCTIONS
-- =============================================

-- Update campaign stats function to include prospects
CREATE OR REPLACE FUNCTION update_campaign_stats(p_campaign_id UUID)
RETURNS void AS $$
DECLARE
  v_total INTEGER;
  v_sent INTEGER;
  v_opened INTEGER;
  v_replied INTEGER;
BEGIN
  -- Count total prospects (from both tables)
  SELECT
    COALESCE((SELECT COUNT(*) FROM campaign_contacts WHERE campaign_id = p_campaign_id), 0) +
    COALESCE((SELECT COUNT(*) FROM campaign_prospects WHERE campaign_id = p_campaign_id), 0)
  INTO v_total;

  -- Count sent emails (from both contact and prospect emails)
  SELECT COUNT(*) INTO v_sent
  FROM outreach_emails e
  WHERE (
    (e.campaign_contact_id IN (SELECT id FROM campaign_contacts WHERE campaign_id = p_campaign_id))
    OR
    (e.campaign_prospect_id IN (SELECT id FROM campaign_prospects WHERE campaign_id = p_campaign_id))
  )
  AND e.status IN ('sent', 'delivered', 'opened', 'clicked', 'replied');

  -- Count unique opens
  SELECT COUNT(*) INTO v_opened
  FROM outreach_emails e
  WHERE (
    (e.campaign_contact_id IN (SELECT id FROM campaign_contacts WHERE campaign_id = p_campaign_id))
    OR
    (e.campaign_prospect_id IN (SELECT id FROM campaign_prospects WHERE campaign_id = p_campaign_id))
  )
  AND e.status IN ('opened', 'clicked', 'replied');

  -- Count replies (from both tables)
  SELECT
    COALESCE((SELECT COUNT(*) FROM campaign_contacts WHERE campaign_id = p_campaign_id AND status = 'replied'), 0) +
    COALESCE((SELECT COUNT(*) FROM campaign_prospects WHERE campaign_id = p_campaign_id AND status = 'replied'), 0)
  INTO v_replied;

  UPDATE outreach_campaigns
  SET
    total_prospects = v_total,
    emails_sent = v_sent,
    emails_opened = v_opened,
    emails_replied = v_replied,
    updated_at = NOW()
  WHERE id = p_campaign_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to schedule next email for prospects
CREATE OR REPLACE FUNCTION schedule_next_prospect_email(p_campaign_prospect_id UUID)
RETURNS UUID AS $$
DECLARE
  v_campaign_prospect campaign_prospects%ROWTYPE;
  v_campaign outreach_campaigns%ROWTYPE;
  v_sequence outreach_sequences%ROWTYPE;
  v_next_position INTEGER;
  v_delay_days INTEGER;
  v_next_email_id UUID;
  v_scheduled_at TIMESTAMPTZ;
BEGIN
  -- Get campaign prospect
  SELECT * INTO v_campaign_prospect
  FROM campaign_prospects
  WHERE id = p_campaign_prospect_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Get campaign
  SELECT * INTO v_campaign
  FROM outreach_campaigns
  WHERE id = v_campaign_prospect.campaign_id;

  IF NOT FOUND OR v_campaign.sequence_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Get sequence
  SELECT * INTO v_sequence
  FROM outreach_sequences
  WHERE id = v_campaign.sequence_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Calculate next position
  v_next_position := v_campaign_prospect.current_step + 1;

  -- Check if sequence is complete
  IF v_next_position > v_sequence.email_count THEN
    -- Mark as completed
    UPDATE campaign_prospects
    SET status = 'completed'
    WHERE id = p_campaign_prospect_id;
    RETURN NULL;
  END IF;

  -- Get delay days for this position
  IF v_next_position > 1 AND array_length(v_sequence.delay_days, 1) >= (v_next_position - 1) THEN
    v_delay_days := v_sequence.delay_days[v_next_position - 1];
  ELSE
    v_delay_days := 3; -- Default 3 days
  END IF;

  -- Calculate scheduled time
  v_scheduled_at := (CURRENT_DATE + v_delay_days) + v_campaign.send_time;

  -- Find the draft email for this position
  SELECT id INTO v_next_email_id
  FROM outreach_emails
  WHERE campaign_prospect_id = p_campaign_prospect_id
  AND position = v_next_position
  AND status = 'draft';

  IF FOUND THEN
    -- Schedule the email
    UPDATE outreach_emails
    SET
      status = 'scheduled',
      scheduled_at = v_scheduled_at,
      updated_at = NOW()
    WHERE id = v_next_email_id;

    RETURN v_next_email_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the after_email_sent trigger to handle prospect emails
CREATE OR REPLACE FUNCTION after_email_sent()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger on status change to 'sent'
  IF NEW.status = 'sent' AND (OLD.status IS NULL OR OLD.status != 'sent') THEN
    -- Schedule next email in sequence (contact-based)
    IF NEW.campaign_contact_id IS NOT NULL THEN
      PERFORM schedule_next_email(NEW.campaign_contact_id);
    END IF;

    -- Schedule next email in sequence (prospect-based)
    IF NEW.campaign_prospect_id IS NOT NULL THEN
      PERFORM schedule_next_prospect_email(NEW.campaign_prospect_id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
