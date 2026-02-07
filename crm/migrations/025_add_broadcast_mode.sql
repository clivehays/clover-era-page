-- Broadcast Mode for Outreach Campaigns
-- Migration: 025_add_broadcast_mode.sql
-- Date: 2026-02-06
-- Description: Adds broadcast mode to send fixed template emails to segments

-- =============================================
-- ADD BROADCAST COLUMNS TO CAMPAIGNS
-- =============================================

-- Campaign type: personalized (existing flow) or broadcast (fixed template)
ALTER TABLE outreach_campaigns
ADD COLUMN IF NOT EXISTS campaign_type TEXT DEFAULT 'personalized'
CHECK (campaign_type IN ('personalized', 'broadcast'));

-- Fixed subject and body for broadcast campaigns
ALTER TABLE outreach_campaigns
ADD COLUMN IF NOT EXISTS broadcast_subject TEXT;

ALTER TABLE outreach_campaigns
ADD COLUMN IF NOT EXISTS broadcast_body TEXT;

-- Track which segment this campaign targets (for filtering)
ALTER TABLE outreach_campaigns
ADD COLUMN IF NOT EXISTS target_segment TEXT;

-- Track which import batch this campaign targets
ALTER TABLE outreach_campaigns
ADD COLUMN IF NOT EXISTS target_import_batch TEXT;

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON COLUMN outreach_campaigns.campaign_type IS 'personalized = research+generate flow, broadcast = fixed template';
COMMENT ON COLUMN outreach_campaigns.broadcast_subject IS 'Fixed email subject for broadcast campaigns';
COMMENT ON COLUMN outreach_campaigns.broadcast_body IS 'Fixed email body for broadcast campaigns';
COMMENT ON COLUMN outreach_campaigns.target_segment IS 'Segment filter: buyer, manager, other, or null for all';
COMMENT ON COLUMN outreach_campaigns.target_import_batch IS 'Import batch filter for targeting specific imports';
