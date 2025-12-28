-- File: migrations/014_add_qualification_fields.sql
-- Sales Playbook Integration - Phase 1.1
-- Add qualification and deal health tracking to opportunities table

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
-- deal_health values: 'healthy', 'at-risk', 'stalled'

-- Playbook phase tracking (more granular than stage)
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS playbook_phase VARCHAR(50) DEFAULT 'qualification';
-- playbook_phase values: 'qualification', 'discovery', 'business_case', 'proposal', 'closing'

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
