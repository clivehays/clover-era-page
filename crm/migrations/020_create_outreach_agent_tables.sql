-- Outreach Agent Database Schema
-- Migration: 020_create_outreach_agent_tables.sql
-- Date: 2026-01-26
-- Description: Creates tables for automated email outreach system

-- =============================================
-- OUTREACH SEQUENCES
-- =============================================
-- Defines email sequence templates (e.g., "CEO Cold Outreach - 3 emails")
CREATE TABLE outreach_sequences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  email_count INTEGER DEFAULT 3,
  delay_days INTEGER[] DEFAULT '{3,4}', -- days between emails [email1->2, email2->3]
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SEQUENCE TEMPLATES
-- =============================================
-- The actual email templates within a sequence
CREATE TABLE sequence_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sequence_id UUID REFERENCES outreach_sequences(id) ON DELETE CASCADE,
  position INTEGER NOT NULL, -- 1, 2, or 3
  subject_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sequence_id, position)
);

-- =============================================
-- PROSPECT RESEARCH
-- =============================================
-- Stores enrichment data and AI-generated research for contacts
CREATE TABLE prospect_research (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,

  -- Apollo enrichment data
  apollo_person_data JSONB,
  apollo_company_data JSONB,
  email_verified BOOLEAN DEFAULT false,

  -- AI-generated research
  research_summary TEXT,
  growth_signals JSONB, -- ["hiring", "funding", "expansion"]
  turnover_estimate_low INTEGER,
  turnover_estimate_high INTEGER,
  personalization_angle TEXT,

  -- Metadata
  researched_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),

  UNIQUE(contact_id)
);

-- =============================================
-- OUTREACH CAMPAIGNS
-- =============================================
-- Groups prospects into campaigns for tracking
CREATE TABLE outreach_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  sequence_id UUID REFERENCES outreach_sequences(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),

  -- Stats (denormalized for performance)
  total_prospects INTEGER DEFAULT 0,
  emails_sent INTEGER DEFAULT 0,
  emails_opened INTEGER DEFAULT 0,
  emails_replied INTEGER DEFAULT 0,

  -- Settings
  send_time TIME DEFAULT '13:00:00', -- Default 8AM EST = 13:00 UTC
  send_days TEXT[] DEFAULT '{monday,tuesday,wednesday,thursday,friday}',
  max_emails_per_day INTEGER DEFAULT 50,

  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CAMPAIGN CONTACTS
-- =============================================
-- Links contacts to campaigns and tracks their progress
CREATE TABLE campaign_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES outreach_campaigns(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,

  -- Progress tracking
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

  UNIQUE(campaign_id, contact_id)
);

-- =============================================
-- OUTREACH EMAILS
-- =============================================
-- Individual personalized emails (generated from templates + research)
CREATE TABLE outreach_emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_contact_id UUID REFERENCES campaign_contacts(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  sequence_id UUID REFERENCES outreach_sequences(id) ON DELETE SET NULL,

  -- Email content
  position INTEGER NOT NULL, -- 1, 2, or 3
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  personalization_notes TEXT, -- Why this angle was chosen

  -- Status tracking
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft',      -- Not yet approved
    'approved',   -- Approved, waiting to schedule
    'scheduled',  -- Scheduled for sending
    'sent',       -- Sent via SendGrid
    'delivered',  -- Confirmed delivered
    'opened',     -- Opened (tracked)
    'clicked',    -- Link clicked (if any)
    'replied',    -- Reply received
    'bounced',    -- Bounce
    'failed'      -- Send failed
  )),

  -- Timestamps
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,

  -- SendGrid tracking
  sendgrid_message_id TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- EMAIL EVENTS
-- =============================================
-- Webhook events from SendGrid
CREATE TABLE email_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  outreach_email_id UUID REFERENCES outreach_emails(id) ON DELETE CASCADE,

  event_type TEXT NOT NULL, -- delivered, opened, clicked, bounced, replied, etc.
  event_data JSONB,
  ip_address TEXT,
  user_agent TEXT,

  received_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- OUTREACH SETTINGS
-- =============================================
-- API keys and configuration (encrypted sensitive values)
CREATE TABLE outreach_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  is_encrypted BOOLEAN DEFAULT false,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_prospect_research_contact ON prospect_research(contact_id);
CREATE INDEX idx_prospect_research_expires ON prospect_research(expires_at);
CREATE INDEX idx_campaign_contacts_campaign ON campaign_contacts(campaign_id);
CREATE INDEX idx_campaign_contacts_contact ON campaign_contacts(contact_id);
CREATE INDEX idx_campaign_contacts_status ON campaign_contacts(status);
CREATE INDEX idx_outreach_emails_campaign_contact ON outreach_emails(campaign_contact_id);
CREATE INDEX idx_outreach_emails_status ON outreach_emails(status);
CREATE INDEX idx_outreach_emails_scheduled ON outreach_emails(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX idx_outreach_emails_sendgrid ON outreach_emails(sendgrid_message_id);
CREATE INDEX idx_email_events_email ON email_events(outreach_email_id);
CREATE INDEX idx_email_events_type ON email_events(event_type);

-- =============================================
-- TRIGGERS
-- =============================================
-- Update timestamps
CREATE TRIGGER update_outreach_sequences_updated_at
  BEFORE UPDATE ON outreach_sequences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_outreach_campaigns_updated_at
  BEFORE UPDATE ON outreach_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_outreach_emails_updated_at
  BEFORE UPDATE ON outreach_emails
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE outreach_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospect_research ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access (same pattern as existing CRM)
CREATE POLICY "Allow authenticated users full access to outreach_sequences"
  ON outreach_sequences FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to sequence_templates"
  ON sequence_templates FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to prospect_research"
  ON prospect_research FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to outreach_campaigns"
  ON outreach_campaigns FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to campaign_contacts"
  ON campaign_contacts FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to outreach_emails"
  ON outreach_emails FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to email_events"
  ON email_events FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to outreach_settings"
  ON outreach_settings FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- =============================================
-- DEFAULT SEQUENCE TEMPLATE
-- =============================================
-- Insert the CEO Cold Outreach sequence based on team's proven template
INSERT INTO outreach_sequences (name, description, email_count, delay_days, is_active)
VALUES (
  'CEO Cold Outreach - Turnover Cost',
  'Pattern interrupt sequence for CEOs/CFOs/COOs. Focus on turnover cost visibility gap.',
  3,
  '{3,4}',
  true
);

-- Insert template emails
DO $$
DECLARE
  seq_id UUID;
BEGIN
  SELECT id INTO seq_id FROM outreach_sequences WHERE name = 'CEO Cold Outreach - Turnover Cost';

  -- Email 1: Pattern Interrupt
  INSERT INTO sequence_templates (sequence_id, position, subject_template, body_template)
  VALUES (seq_id, 1,
    '{{company_name}} - turnover math',
    '{{first_name}} -

{{personalization_hook}}

At {{employee_count}} employees, if even {{turnover_rate}}% of your team turns over this year, you''re looking at a ${{turnover_cost}}+ hole that won''t show up on any dashboard.

Not pitching. Just curious if that number lands or feels off.

Clive');

  -- Email 2: Second Angle
  INSERT INTO sequence_templates (sequence_id, position, subject_template, body_template)
  VALUES (seq_id, 2,
    're: {{company_name}} - turnover math',
    '{{first_name}} -

One more thought on this.

Talked to a {{similar_role}} at {{similar_company_type}} last month. They were tracking turnover rate at {{example_rate}}%. Looked manageable.

When we calculated actual cost - ramp time, lost deals, institutional knowledge walking out - it was ${{example_cost}}. {{example_reaction}}

Might be worth 15 minutes to see what {{company_name}}''s number actually looks like.

Either way, no chase from me.

Clive');

  -- Email 3: Direct Ask
  INSERT INTO sequence_templates (sequence_id, position, subject_template, body_template)
  VALUES (seq_id, 3,
    're: {{company_name}} - turnover math',
    '{{first_name}} -

Last note on this.

If turnover cost isn''t on your radar right now, I''ll drop it.

But if there''s any chance the number is bigger than your team thinks{{context_specific}}, I can show you the math in 15 minutes. No deck. Just a calculator.

Worth a look, or should I close the loop?

Clive');
END $$;

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to increment campaign emails_sent counter
CREATE OR REPLACE FUNCTION increment_campaign_emails_sent(campaign_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE outreach_campaigns
  SET emails_sent = emails_sent + 1
  WHERE id = campaign_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update campaign stats
CREATE OR REPLACE FUNCTION update_campaign_stats(p_campaign_id UUID)
RETURNS void AS $$
DECLARE
  v_total INTEGER;
  v_sent INTEGER;
  v_opened INTEGER;
  v_replied INTEGER;
BEGIN
  -- Count total prospects
  SELECT COUNT(*) INTO v_total
  FROM campaign_contacts
  WHERE campaign_id = p_campaign_id;

  -- Count sent emails
  SELECT COUNT(*) INTO v_sent
  FROM outreach_emails e
  JOIN campaign_contacts cc ON e.campaign_contact_id = cc.id
  WHERE cc.campaign_id = p_campaign_id
  AND e.status IN ('sent', 'delivered', 'opened', 'clicked', 'replied');

  -- Count unique opens
  SELECT COUNT(DISTINCT e.campaign_contact_id) INTO v_opened
  FROM outreach_emails e
  JOIN campaign_contacts cc ON e.campaign_contact_id = cc.id
  WHERE cc.campaign_id = p_campaign_id
  AND e.status IN ('opened', 'clicked', 'replied');

  -- Count replies
  SELECT COUNT(*) INTO v_replied
  FROM campaign_contacts
  WHERE campaign_id = p_campaign_id
  AND status = 'replied';

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

-- Function to schedule next email in sequence
CREATE OR REPLACE FUNCTION schedule_next_email(p_campaign_contact_id UUID)
RETURNS UUID AS $$
DECLARE
  v_campaign_contact campaign_contacts%ROWTYPE;
  v_campaign outreach_campaigns%ROWTYPE;
  v_sequence outreach_sequences%ROWTYPE;
  v_next_position INTEGER;
  v_delay_days INTEGER;
  v_next_email_id UUID;
  v_scheduled_at TIMESTAMPTZ;
BEGIN
  -- Get campaign contact
  SELECT * INTO v_campaign_contact
  FROM campaign_contacts
  WHERE id = p_campaign_contact_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Get campaign
  SELECT * INTO v_campaign
  FROM outreach_campaigns
  WHERE id = v_campaign_contact.campaign_id;

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
  v_next_position := v_campaign_contact.current_step + 1;

  -- Check if sequence is complete
  IF v_next_position > v_sequence.email_count THEN
    -- Mark as completed
    UPDATE campaign_contacts
    SET status = 'completed'
    WHERE id = p_campaign_contact_id;
    RETURN NULL;
  END IF;

  -- Get delay days for this position
  IF v_next_position > 1 AND array_length(v_sequence.delay_days, 1) >= (v_next_position - 1) THEN
    v_delay_days := v_sequence.delay_days[v_next_position - 1];
  ELSE
    v_delay_days := 3; -- Default 3 days
  END IF;

  -- Calculate scheduled time (campaign send_time + delay days)
  v_scheduled_at := (CURRENT_DATE + v_delay_days) + v_campaign.send_time;

  -- Find the draft email for this position
  SELECT id INTO v_next_email_id
  FROM outreach_emails
  WHERE campaign_contact_id = p_campaign_contact_id
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

-- Trigger to auto-schedule next email after send
CREATE OR REPLACE FUNCTION after_email_sent()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger on status change to 'sent'
  IF NEW.status = 'sent' AND (OLD.status IS NULL OR OLD.status != 'sent') THEN
    -- Schedule next email in sequence
    PERFORM schedule_next_email(NEW.campaign_contact_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_after_email_sent
  AFTER UPDATE ON outreach_emails
  FOR EACH ROW
  WHEN (NEW.status = 'sent')
  EXECUTE FUNCTION after_email_sent();

-- =============================================
-- DEFAULT SETTINGS
-- =============================================
INSERT INTO outreach_settings (key, value, is_encrypted) VALUES
  ('sending_domain', 'go.cloverera.com', false),
  ('max_emails_per_day', '50', false),
  ('default_send_time', '13:00', false), -- 8AM EST in UTC
  ('reply_creates_opportunity', 'true', false),
  ('from_email', 'clive.hays@go.cloverera.com', false),
  ('from_name', 'Clive Hays', false),
  ('reply_to', 'clive.hays@cloverera.com', false);
