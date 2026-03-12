-- Update campaign stats function to include clicked count and use timestamps
-- instead of status-based counting (more accurate since status can change)
CREATE OR REPLACE FUNCTION update_campaign_stats(p_campaign_id UUID)
RETURNS void AS $$
DECLARE
  v_total INTEGER;
  v_sent INTEGER;
  v_opened INTEGER;
  v_clicked INTEGER;
  v_replied INTEGER;
BEGIN
  -- Count total prospects (from both tables)
  SELECT
    COALESCE((SELECT COUNT(*) FROM campaign_contacts WHERE campaign_id = p_campaign_id), 0) +
    COALESCE((SELECT COUNT(*) FROM campaign_prospects WHERE campaign_id = p_campaign_id), 0)
  INTO v_total;

  -- Count sent emails using sent_at timestamp
  SELECT COUNT(*) INTO v_sent
  FROM outreach_emails e
  WHERE (
    (e.campaign_contact_id IN (SELECT id FROM campaign_contacts WHERE campaign_id = p_campaign_id))
    OR
    (e.campaign_prospect_id IN (SELECT id FROM campaign_prospects WHERE campaign_id = p_campaign_id))
  )
  AND e.sent_at IS NOT NULL;

  -- Count opened emails using opened_at timestamp
  SELECT COUNT(*) INTO v_opened
  FROM outreach_emails e
  WHERE (
    (e.campaign_contact_id IN (SELECT id FROM campaign_contacts WHERE campaign_id = p_campaign_id))
    OR
    (e.campaign_prospect_id IN (SELECT id FROM campaign_prospects WHERE campaign_id = p_campaign_id))
  )
  AND e.opened_at IS NOT NULL;

  -- Count clicked emails using clicked_at timestamp
  SELECT COUNT(*) INTO v_clicked
  FROM outreach_emails e
  WHERE (
    (e.campaign_contact_id IN (SELECT id FROM campaign_contacts WHERE campaign_id = p_campaign_id))
    OR
    (e.campaign_prospect_id IN (SELECT id FROM campaign_prospects WHERE campaign_id = p_campaign_id))
  )
  AND e.clicked_at IS NOT NULL;

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
    emails_clicked = v_clicked,
    emails_replied = v_replied,
    updated_at = NOW()
  WHERE id = p_campaign_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
