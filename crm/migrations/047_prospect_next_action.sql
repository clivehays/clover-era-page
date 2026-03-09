-- =============================================
-- Migration 047: Add next_action fields to outreach_prospects
-- =============================================
-- Enables outreach prospects to appear in Command Center
-- "Due Today" and "Overdue" sections when actions are set.
-- Used by check-replies to flag reply follow-ups.
-- =============================================

ALTER TABLE outreach_prospects ADD COLUMN IF NOT EXISTS next_action TEXT;
ALTER TABLE outreach_prospects ADD COLUMN IF NOT EXISTS next_action_date DATE;
