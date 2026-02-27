-- =============================================================================
-- MIGRATION 029: DUAL-FUNNEL SALES SYSTEM
-- =============================================================================
-- Extends the CRM to support two parallel funnels:
--   Funnel A: Operational Buyers (CFO/CEO/COO) - high-ticket outbound
--   Funnel B: Team Managers (Self-Serve) - LinkedIn engagement path
--
-- Run in Supabase SQL Editor
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. ADD FUNNEL TYPE TO OPPORTUNITIES
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS funnel TEXT DEFAULT 'operational';

-- Set all existing opportunities to operational funnel
UPDATE opportunities SET funnel = 'operational' WHERE funnel IS NULL;

-- Add check constraint for funnel
DO $$ BEGIN
  ALTER TABLE opportunities ADD CONSTRAINT opportunities_funnel_check
    CHECK (funnel IN ('operational', 'self_serve'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. EXPAND STAGE CONSTRAINT FOR BOTH FUNNELS
-- ─────────────────────────────────────────────────────────────────────────────

-- Drop existing stage constraint (may have different names)
DO $$ BEGIN
  ALTER TABLE opportunities DROP CONSTRAINT IF EXISTS opportunities_stage_check;
  ALTER TABLE opportunities DROP CONSTRAINT IF EXISTS opportunities_stage_check1;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- Find and drop any CHECK constraint on stage column
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
    WHERE con.conrelid = 'opportunities'::regclass
      AND con.contype = 'c'
      AND att.attname = 'stage'
  ) LOOP
    EXECUTE 'ALTER TABLE opportunities DROP CONSTRAINT ' || quote_ident(r.conname);
  END LOOP;
END $$;

ALTER TABLE opportunities ADD CONSTRAINT opportunities_stage_check
  CHECK (stage IN (
    -- Funnel A: Operational Buyers
    'cold-outbound', 'outbound-reply', 'call-booked', 'call-completed',
    'qualified-opportunity', 'pilot-started', 'active-customer', 'churned-lost',
    -- Funnel B: Self-Serve
    'linkedin-engagement', 'post-comment-email', 'assessment-taken',
    'trial-started', 'trial-day-7', 'trial-day-12', 'converted-paid',
    'trial-expired',
    -- Legacy stages (preserved for existing data until migrated)
    'lead', 'qualified', 'demo-scheduled', 'demo-completed',
    'proposal', 'negotiation', 'pilot', 'closed-won', 'closed-lost'
  ));

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. EXPAND SOURCE CONSTRAINT FOR TRAFFIC TRACKING
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
    WHERE con.conrelid = 'opportunities'::regclass
      AND con.contype = 'c'
      AND att.attname = 'source'
  ) LOOP
    EXECUTE 'ALTER TABLE opportunities DROP CONSTRAINT ' || quote_ident(r.conname);
  END LOOP;
END $$;

ALTER TABLE opportunities ADD CONSTRAINT opportunities_source_check
  CHECK (source IN (
    'apollo-outbound', 'linkedin-post-comment', 'linkedin-dm', 'website-direct',
    'linkedin-profile-click', 'apollo-website-tracker', 'referral',
    'newsletter', 'book-link', 'other',
    -- Legacy sources
    'partner', 'direct', 'inbound', 'outbound', 'event', 'website'
  ));

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. FUNNEL A: OPERATIONAL BUYER TRACKING FIELDS
-- ─────────────────────────────────────────────────────────────────────────────

-- Outbound tracking
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS report_pdf_link TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS report_version TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS email_opened BOOLEAN;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS report_downloaded BOOLEAN;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS reply_sentiment TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS reply_date DATE;

-- Call tracking
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS call_type TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS call_outcome TEXT;

-- Notes fields (shared across funnels)
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS key_pain_points TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS objections TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS key_quotes TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS personal_notes TEXT;

-- Qualified opportunity fields
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS champion_name TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS champion_title TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS competitors TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS proposal_pdf_link TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS proposal_sent_date DATE;

-- Pilot/Contract fields
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS contract_start_date DATE;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS contract_length_months INTEGER;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS success_metrics TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS kickoff_date DATE;

-- Customer fields
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS renewal_date DATE;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS nps_score INTEGER;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS expansion_opportunity BOOLEAN;

-- Churned/Lost fields
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS lost_date DATE;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS lost_reason TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS competitor_won TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS re_engagement_date DATE;

-- Pricing tier
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS pricing_tier TEXT;

-- Add CHECK constraints for enum fields
DO $$ BEGIN
  ALTER TABLE opportunities ADD CONSTRAINT opp_reply_sentiment_check
    CHECK (reply_sentiment IN ('positive', 'neutral', 'negative'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE opportunities ADD CONSTRAINT opp_call_type_check
    CHECK (call_type IN ('discovery', 'demo', 'closing'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE opportunities ADD CONSTRAINT opp_call_outcome_check
    CHECK (call_outcome IN ('qualified', 'not-qualified', 'needs-follow-up'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE opportunities ADD CONSTRAINT opp_lost_reason_check
    CHECK (lost_reason IN ('price', 'timing', 'competitor', 'no-decision', 'other'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE opportunities ADD CONSTRAINT opp_pricing_tier_check
    CHECK (pricing_tier IN ('single-team', '5-teams', '10-teams', '25-teams', 'custom'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. FUNNEL B: SELF-SERVE TRACKING FIELDS
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS linkedin_post_number TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS comment_text TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS assessment_completed_date DATE;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS assessment_results JSONB;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS trial_start_date DATE;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS trial_end_date DATE;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS trial_team_size INTEGER;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS trial_usage TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS trial_day7_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS trial_day12_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS conversion_date DATE;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS plan_selected TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS trial_expired_reason TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS nurture_enrolled BOOLEAN DEFAULT FALSE;

DO $$ BEGIN
  ALTER TABLE opportunities ADD CONSTRAINT opp_trial_usage_check
    CHECK (trial_usage IN ('high', 'medium', 'low'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. EXTEND CONTACTS TABLE
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS traffic_source TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS linkedin_post_number TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS comment_text TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS team_size_estimated INTEGER;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS pain_points TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS objections TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS key_quotes TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS personal_notes TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS next_action TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS next_action_date DATE;

DO $$ BEGIN
  ALTER TABLE contacts ADD CONSTRAINT contacts_traffic_source_check
    CHECK (traffic_source IN (
      'apollo-outbound', 'linkedin-post-comment', 'linkedin-dm', 'website-direct',
      'linkedin-profile-click', 'apollo-website-tracker', 'referral',
      'newsletter', 'book-link', 'other'
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. STAGE PROBABILITY VIEW (for pipeline forecasting)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW funnel_stage_probabilities AS
SELECT * FROM (VALUES
  ('operational'::TEXT, 'cold-outbound'::TEXT, 0.02::NUMERIC, 1::INTEGER),
  ('operational', 'outbound-reply', 0.10, 2),
  ('operational', 'call-booked', 0.20, 3),
  ('operational', 'call-completed', 0.30, 4),
  ('operational', 'qualified-opportunity', 0.50, 5),
  ('operational', 'pilot-started', 0.90, 6),
  ('operational', 'active-customer', 1.00, 7),
  ('operational', 'churned-lost', 0.00, 8),
  ('self_serve', 'linkedin-engagement', 0.01, 1),
  ('self_serve', 'post-comment-email', 0.05, 2),
  ('self_serve', 'assessment-taken', 0.15, 3),
  ('self_serve', 'trial-started', 0.40, 4),
  ('self_serve', 'trial-day-7', 0.60, 5),
  ('self_serve', 'trial-day-12', 0.60, 6),
  ('self_serve', 'converted-paid', 1.00, 7),
  ('self_serve', 'active-customer', 1.00, 8),
  ('self_serve', 'trial-expired', 0.00, 9)
) AS t(funnel, stage, probability, sort_order);

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. WEEKLY PIPELINE SUMMARY VIEW
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW weekly_pipeline_summary AS
SELECT
  o.funnel,
  o.stage,
  fsp.sort_order,
  fsp.probability,
  COUNT(*) as deal_count,
  COALESCE(SUM(o.value), 0) as total_value,
  COALESCE(SUM(o.value * fsp.probability), 0) as weighted_value
FROM opportunities o
LEFT JOIN funnel_stage_probabilities fsp
  ON o.funnel = fsp.funnel AND o.stage = fsp.stage
WHERE o.stage NOT IN ('churned-lost', 'trial-expired', 'closed-lost')
GROUP BY o.funnel, o.stage, fsp.sort_order, fsp.probability
ORDER BY o.funnel, fsp.sort_order;

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. RLS POLICIES FOR NEW COLUMNS (inherit existing policies)
-- ─────────────────────────────────────────────────────────────────────────────
-- No new RLS needed - existing table-level policies on opportunities and
-- contacts already cover all columns. New columns inherit automatically.

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. DONE
-- ─────────────────────────────────────────────────────────────────────────────
-- Next: Run 029b_migrate_existing_data.sql to remap existing opportunities
