-- File: migrations/017_create_discovery_answers_table.sql
-- Sales Playbook Integration - Phase 1.4
-- Create discovery answers table for structured discovery capture

-- DISCOVERY ANSWERS TABLE (structured discovery capture)
CREATE TABLE IF NOT EXISTS discovery_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,

    -- Which phase and question
    phase VARCHAR(50) NOT NULL,
    -- phase values: 'current_state', 'impact_cost', 'future_state', 'decision_process', 'stakeholder_map'

    question_key VARCHAR(100) NOT NULL,
    question_text TEXT NOT NULL,

    -- The answer
    answer TEXT,
    their_exact_words TEXT, -- Verbatim quotes for business case

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
CREATE POLICY "Users can view discovery answers" ON discovery_answers
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert discovery answers" ON discovery_answers
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

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

CREATE TRIGGER trigger_discovery_answer_updated
    BEFORE UPDATE ON discovery_answers
    FOR EACH ROW
    EXECUTE FUNCTION update_discovery_answer_timestamp();
