-- File: migrations/016_create_stakeholders_table.sql
-- Sales Playbook Integration - Phase 1.3
-- Create stakeholders table for multi-threading deals

-- STAKEHOLDERS TABLE (for multi-threading deals)
CREATE TABLE IF NOT EXISTS stakeholders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,

    -- Role in the deal
    role VARCHAR(50) NOT NULL,
    -- role values: 'mobilizer', 'decision_maker', 'budget_holder', 'influencer', 'end_user', 'blocker', 'legal', 'procurement'

    -- Their stance
    sentiment VARCHAR(20) DEFAULT 'unknown',
    -- sentiment values: 'champion', 'supportive', 'neutral', 'skeptical', 'blocker', 'unknown'

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
CREATE POLICY "Users can view stakeholders" ON stakeholders
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert stakeholders" ON stakeholders
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update stakeholders" ON stakeholders
    FOR UPDATE USING (auth.role() = 'authenticated');

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

CREATE TRIGGER trigger_stakeholder_updated
    BEFORE UPDATE ON stakeholders
    FOR EACH ROW
    EXECUTE FUNCTION update_stakeholder_timestamp();
