-- File: migrations/015_add_discovery_fields.sql
-- Sales Playbook Integration - Phase 1.2
-- Add discovery and business case fields to opportunities table

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
-- buyer_type values: 'turnover', 'disengaged', 'both'

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
