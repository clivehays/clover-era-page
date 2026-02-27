-- =============================================================================
-- MIGRATION 029b: MIGRATE EXISTING DATA TO NEW FUNNEL STAGES
-- =============================================================================
-- Run AFTER 029_dual_funnel_system.sql
-- Maps existing 9-stage pipeline to Funnel A (Operational Buyers)
-- =============================================================================

-- Set funnel for all existing opportunities
UPDATE opportunities SET funnel = 'operational' WHERE funnel IS NULL;

-- Remap stages
UPDATE opportunities SET stage = 'cold-outbound' WHERE stage = 'lead';
UPDATE opportunities SET stage = 'outbound-reply' WHERE stage = 'qualified';
UPDATE opportunities SET stage = 'call-booked' WHERE stage = 'demo-scheduled';
UPDATE opportunities SET stage = 'call-completed' WHERE stage = 'demo-completed';
UPDATE opportunities SET stage = 'qualified-opportunity' WHERE stage IN ('proposal', 'negotiation');
UPDATE opportunities SET stage = 'pilot-started' WHERE stage = 'pilot';
UPDATE opportunities SET stage = 'active-customer' WHERE stage = 'closed-won';
UPDATE opportunities SET stage = 'churned-lost' WHERE stage = 'closed-lost';

-- Map sources to new values where possible
UPDATE opportunities SET source = 'apollo-outbound' WHERE source = 'outbound';
UPDATE opportunities SET source = 'website-direct' WHERE source = 'website';
UPDATE opportunities SET source = 'other' WHERE source = 'event';

-- Verify migration
-- SELECT stage, funnel, COUNT(*) FROM opportunities GROUP BY stage, funnel ORDER BY funnel, stage;
