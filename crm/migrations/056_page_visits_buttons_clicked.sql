-- Add buttons_clicked column to page_visits
-- Stores comma-separated list of CTA labels clicked during the visit
ALTER TABLE page_visits ADD COLUMN IF NOT EXISTS buttons_clicked TEXT;
