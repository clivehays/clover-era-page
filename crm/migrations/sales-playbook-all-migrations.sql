-- =============================================================================
-- SALES PLAYBOOK INTEGRATION - ALL MIGRATIONS
-- =============================================================================
-- Run this file in Supabase SQL Editor to apply all sales playbook changes
-- This combines migrations 014, 015, 016, and 017
-- =============================================================================

-- =============================================================================
-- MIGRATION 014: QUALIFICATION FIELDS
-- =============================================================================

-- QUALIFICATION CRITERIA (7-point system)
-- These track the PACT framework + mobilizer identification
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS qual_problem_acknowledged BOOLEAN DEFAULT NULL;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS qual_problem_quantifiable BOOLEAN DEFAULT NULL;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS qual_decision_maker_identified BOOLEAN DEFAULT NULL;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS qual_decision_maker_access BOOLEAN DEFAULT NULL;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS qual_budget_confirmed BOOLEAN DEFAULT NULL;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS qual_timeline_or_trigger BOOLEAN DEFAULT NULL;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS qual_mobilizer_identified BOOLEAN DEFAULT NULL;

-- Auto-calculated qualification score (0-7)
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS qualification_score INTEGER DEFAULT 0;

-- Deal health tracking
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS last_contact_date DATE;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS days_in_stage INTEGER DEFAULT 0;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS deal_health VARCHAR(20) DEFAULT 'unknown';

-- Playbook phase tracking (more granular than stage)
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS playbook_phase VARCHAR(50) DEFAULT 'qualification';

-- Create function to auto-calculate qualification score
CREATE OR REPLACE FUNCTION calculate_qualification_score()
RETURNS TRIGGER AS $$
BEGIN
    NEW.qualification_score := (
        CASE WHEN NEW.qual_problem_acknowledged = true THEN 1 ELSE 0 END +
        CASE WHEN NEW.qual_problem_quantifiable = true THEN 1 ELSE 0 END +
        CASE WHEN NEW.qual_decision_maker_identified = true THEN 1 ELSE 0 END +
        CASE WHEN NEW.qual_decision_maker_access = true THEN 1 ELSE 0 END +
        CASE WHEN NEW.qual_budget_confirmed = true THEN 1 ELSE 0 END +
        CASE WHEN NEW.qual_timeline_or_trigger = true THEN 1 ELSE 0 END +
        CASE WHEN NEW.qual_mobilizer_identified = true THEN 1 ELSE 0 END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for qualification score
DROP TRIGGER IF EXISTS trigger_calc_qualification_score ON opportunities;
CREATE TRIGGER trigger_calc_qualification_score
    BEFORE INSERT OR UPDATE ON opportunities
    FOR EACH ROW
    EXECUTE FUNCTION calculate_qualification_score();

-- Create function to update days_in_stage
CREATE OR REPLACE FUNCTION update_days_in_stage()
RETURNS TRIGGER AS $$
BEGIN
    -- If stage changed, reset the stage_entered_at timestamp
    IF OLD.stage IS DISTINCT FROM NEW.stage THEN
        NEW.stage_entered_at := NOW();
        NEW.days_in_stage := 0;
    ELSE
        -- Calculate days in current stage
        NEW.days_in_stage := EXTRACT(DAY FROM (NOW() - COALESCE(NEW.stage_entered_at, NOW())));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for days_in_stage
DROP TRIGGER IF EXISTS trigger_update_days_in_stage ON opportunities;
CREATE TRIGGER trigger_update_days_in_stage
    BEFORE UPDATE ON opportunities
    FOR EACH ROW
    EXECUTE FUNCTION update_days_in_stage();

-- Create function to auto-update deal health
CREATE OR REPLACE FUNCTION update_deal_health()
RETURNS TRIGGER AS $$
BEGIN
    -- Stalled: No activity in 14+ days OR stuck in stage 21+ days
    IF NEW.days_in_stage >= 21 THEN
        NEW.deal_health := 'stalled';
    ELSIF NEW.last_contact_date IS NULL OR (CURRENT_DATE - NEW.last_contact_date) >= 14 THEN
        NEW.deal_health := 'stalled';
    -- At-risk: No activity in 7-13 days OR stuck in stage 14-20 days
    ELSIF NEW.days_in_stage >= 14 OR (CURRENT_DATE - NEW.last_contact_date) >= 7 THEN
        NEW.deal_health := 'at-risk';
    -- Healthy: Recent activity and progressing
    ELSE
        NEW.deal_health := 'healthy';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for deal health
DROP TRIGGER IF EXISTS trigger_update_deal_health ON opportunities;
CREATE TRIGGER trigger_update_deal_health
    BEFORE INSERT OR UPDATE ON opportunities
    FOR EACH ROW
    EXECUTE FUNCTION update_deal_health();

-- =============================================================================
-- MIGRATION 015: DISCOVERY FIELDS
-- =============================================================================

-- DISCOVERY DATA (captured during discovery calls)
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS discovery_current_state TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS discovery_impact_cost TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS discovery_future_state TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS discovery_decision_process TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS discovery_stakeholder_map TEXT;

-- Discovery completion tracking
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS discovery_phase_1_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS discovery_phase_2_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS discovery_phase_3_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS discovery_phase_4_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS discovery_phase_5_complete BOOLEAN DEFAULT FALSE;

-- BUSINESS CASE DATA (for ROI calculations)
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS buyer_type VARCHAR(50);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS annual_turnover_count INTEGER;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS avg_replacement_cost DECIMAL(12,2);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS total_turnover_cost DECIMAL(12,2);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS productivity_gap_percent INTEGER;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS disengaged_employee_count INTEGER;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS avg_salary DECIMAL(12,2);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS total_productivity_loss DECIMAL(12,2);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS total_problem_cost DECIMAL(12,2);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS projected_savings DECIMAL(12,2);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS projected_roi_multiple DECIMAL(5,2);

-- Their exact words (for proposals and objection handling)
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS their_words_problem TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS their_words_impact TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS their_words_goal TEXT;

-- =============================================================================
-- MIGRATION 016: STAKEHOLDERS TABLE
-- =============================================================================

-- STAKEHOLDERS TABLE (for multi-threading deals)
CREATE TABLE IF NOT EXISTS stakeholders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,

    -- Role in the deal
    role VARCHAR(50) NOT NULL,

    -- Their stance
    sentiment VARCHAR(20) DEFAULT 'unknown',

    -- Engagement tracking
    last_contact_date DATE,
    contact_count INTEGER DEFAULT 0,

    -- Notes
    notes TEXT,
    key_concerns TEXT,
    what_they_care_about TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_stakeholders_opportunity ON stakeholders(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_stakeholders_contact ON stakeholders(contact_id);
CREATE INDEX IF NOT EXISTS idx_stakeholders_role ON stakeholders(role);

-- Enable RLS
ALTER TABLE stakeholders ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow authenticated users to manage stakeholders)
DROP POLICY IF EXISTS "Users can view stakeholders" ON stakeholders;
CREATE POLICY "Users can view stakeholders" ON stakeholders
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can insert stakeholders" ON stakeholders;
CREATE POLICY "Users can insert stakeholders" ON stakeholders
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update stakeholders" ON stakeholders;
CREATE POLICY "Users can update stakeholders" ON stakeholders
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can delete stakeholders" ON stakeholders;
CREATE POLICY "Users can delete stakeholders" ON stakeholders
    FOR DELETE USING (auth.role() = 'authenticated');

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_stakeholder_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_stakeholder_updated ON stakeholders;
CREATE TRIGGER trigger_stakeholder_updated
    BEFORE UPDATE ON stakeholders
    FOR EACH ROW
    EXECUTE FUNCTION update_stakeholder_timestamp();

-- =============================================================================
-- MIGRATION 017: DISCOVERY ANSWERS TABLE
-- =============================================================================

-- DISCOVERY ANSWERS TABLE (structured discovery capture)
CREATE TABLE IF NOT EXISTS discovery_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,

    -- Which phase and question
    phase VARCHAR(50) NOT NULL,
    question_key VARCHAR(100) NOT NULL,
    question_text TEXT NOT NULL,

    -- The answer
    answer TEXT,
    their_exact_words TEXT,

    -- Metadata
    answered_at TIMESTAMP WITH TIME ZONE,
    answered_by UUID REFERENCES auth.users(id),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure one answer per question per opportunity
    UNIQUE(opportunity_id, question_key)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_discovery_opportunity ON discovery_answers(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_discovery_phase ON discovery_answers(phase);

-- Enable RLS
ALTER TABLE discovery_answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view discovery answers" ON discovery_answers;
CREATE POLICY "Users can view discovery answers" ON discovery_answers
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can insert discovery answers" ON discovery_answers;
CREATE POLICY "Users can insert discovery answers" ON discovery_answers
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update discovery answers" ON discovery_answers;
CREATE POLICY "Users can update discovery answers" ON discovery_answers
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_discovery_answer_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_discovery_answer_updated ON discovery_answers;
CREATE TRIGGER trigger_discovery_answer_updated
    BEFORE UPDATE ON discovery_answers
    FOR EACH ROW
    EXECUTE FUNCTION update_discovery_answer_timestamp();

-- =============================================================================
-- COMPLETE!
-- =============================================================================
-- After running this migration, you should have:
-- 1. 14 new columns on opportunities table for qualification tracking
-- 2. 16 new columns on opportunities table for discovery/business case
-- 3. New stakeholders table with RLS policies
-- 4. New discovery_answers table with RLS policies
-- 5. Triggers for auto-calculating qualification score and deal health
-- =============================================================================
