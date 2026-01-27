-- Migration: Add days_delay to sequence_templates for proper follow-up scheduling
-- This enables emails 2 and 3 to be auto-scheduled X days after the previous email

-- Add days_delay column to sequence_templates
ALTER TABLE sequence_templates
  ADD COLUMN IF NOT EXISTS days_delay INTEGER DEFAULT 0;

-- Set default delays: Email 1 = 0, Email 2 = 3 days, Email 3 = 5 days
UPDATE sequence_templates SET days_delay = 0 WHERE position = 1;
UPDATE sequence_templates SET days_delay = 3 WHERE position = 2;
UPDATE sequence_templates SET days_delay = 5 WHERE position = 3;

-- Add comment explaining the field
COMMENT ON COLUMN sequence_templates.days_delay IS 'Days to wait after previous email before sending this one. Position 1 is always 0.';

-- Add index for quick lookups
CREATE INDEX IF NOT EXISTS idx_sequence_templates_position ON sequence_templates(sequence_id, position);
