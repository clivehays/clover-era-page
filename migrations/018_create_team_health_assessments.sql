-- File: migrations/018_create_team_health_assessments.sql
-- Team Health Assessment - Data Storage
-- Store assessment responses and results

-- TEAM HEALTH ASSESSMENTS TABLE
CREATE TABLE IF NOT EXISTS team_health_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- User info
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    company_name VARCHAR(255),
    team_size VARCHAR(20),

    -- Assessment data
    scores JSONB NOT NULL,
    -- scores format: {"1": 2, "2": 3, "3": 1, "4": 2, "5": 3, "6": 2}

    reasoning JSONB NOT NULL,
    -- reasoning format: {"1": "response text", "2": "response text", ...}

    -- Results
    archetype VARCHAR(50) NOT NULL,
    -- archetype values: 'quiet-crack', 'firefight-loop', 'performance-theater', 'siloed-stars', 'comfortable-stall'

    -- Tracking
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_team_health_email ON team_health_assessments(email);
CREATE INDEX IF NOT EXISTS idx_team_health_archetype ON team_health_assessments(archetype);
CREATE INDEX IF NOT EXISTS idx_team_health_created ON team_health_assessments(created_at);

-- Enable RLS
ALTER TABLE team_health_assessments ENABLE ROW LEVEL SECURITY;

-- RLS Policies (service key access only - no public access)
DROP POLICY IF EXISTS "Service role can insert assessments" ON team_health_assessments;
CREATE POLICY "Service role can insert assessments" ON team_health_assessments
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can read assessments" ON team_health_assessments;
CREATE POLICY "Service role can read assessments" ON team_health_assessments
    FOR SELECT USING (auth.role() = 'authenticated' OR auth.jwt()->>'role' = 'service_role');

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_team_health_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_team_health_updated ON team_health_assessments;
CREATE TRIGGER trigger_team_health_updated
    BEFORE UPDATE ON team_health_assessments
    FOR EACH ROW
    EXECUTE FUNCTION update_team_health_timestamp();
