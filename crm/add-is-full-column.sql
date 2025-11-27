-- Add is_full column to roundtable_cohorts table
-- This allows manually marking a cohort as full regardless of actual bookings

ALTER TABLE roundtable_cohorts
ADD COLUMN IF NOT EXISTS is_full BOOLEAN DEFAULT false;

-- Verify the column was added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'roundtable_cohorts'
AND column_name = 'is_full';
