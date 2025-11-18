-- Migration: Add new pricing tier fields to opportunities table
-- Run this in Supabase SQL Editor to add the new pricing model fields

-- Add new columns to opportunities table
ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS pricing_tier TEXT CHECK (pricing_tier IN ('poc', 'departmental', 'enterprise-small', 'enterprise-medium', 'enterprise-large', 'custom')),
ADD COLUMN IF NOT EXISTS employee_count INTEGER,
ADD COLUMN IF NOT EXISTS department_count INTEGER;

-- Add comments to document the new fields
COMMENT ON COLUMN opportunities.pricing_tier IS 'Pricing tier: poc ($24k), departmental ($48k), enterprise-small ($96k), enterprise-medium ($180k), enterprise-large ($300k), or custom';
COMMENT ON COLUMN opportunities.employee_count IS 'Total number of employees covered by this opportunity';
COMMENT ON COLUMN opportunities.department_count IS 'Number of departments covered by this opportunity';

-- Optional: Update existing records to have a default pricing tier based on their managers_count
-- This can help migrate old data to the new pricing model
UPDATE opportunities
SET pricing_tier = CASE
    WHEN managers_count IS NULL THEN 'departmental'
    WHEN managers_count <= 5 THEN 'poc'
    WHEN managers_count <= 20 THEN 'departmental'
    WHEN managers_count <= 50 THEN 'enterprise-small'
    WHEN managers_count <= 100 THEN 'enterprise-medium'
    ELSE 'enterprise-large'
END
WHERE pricing_tier IS NULL;

-- Note: You may want to keep managers_count and monthly_recurring_revenue columns
-- for historical data or remove them if you want to fully transition to the new model.
-- To remove old fields (optional - uncomment if desired):
-- ALTER TABLE opportunities DROP COLUMN managers_count;
-- ALTER TABLE opportunities DROP COLUMN monthly_recurring_revenue;
