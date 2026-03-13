-- Add UTM tracking columns to capture traffic source from email links
ALTER TABLE page_visits ADD COLUMN utm_source TEXT;
ALTER TABLE page_visits ADD COLUMN utm_campaign TEXT;
