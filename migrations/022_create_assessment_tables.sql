-- Migration 022: Create CLOVER-EQ Assessment Tables
-- Run this in Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table 1: Assessments (main record for each participant)
CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_name TEXT NOT NULL,
    participant_email TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 2: Assessment Responses (individual question responses)
CREATE TABLE IF NOT EXISTS assessment_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL,
    response INTEGER NOT NULL CHECK (response >= 1 AND response <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(assessment_id, question_id)
);

-- Table 3: Assessment Scores (calculated scores after completion)
CREATE TABLE IF NOT EXISTS assessment_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE UNIQUE,
    communication INTEGER NOT NULL CHECK (communication >= 5 AND communication <= 25),
    learning INTEGER NOT NULL CHECK (learning >= 5 AND learning <= 25),
    opportunities INTEGER NOT NULL CHECK (opportunities >= 5 AND opportunities <= 25),
    vulnerability INTEGER NOT NULL CHECK (vulnerability >= 5 AND vulnerability <= 25),
    enablement INTEGER NOT NULL CHECK (enablement >= 5 AND enablement <= 25),
    reflection INTEGER NOT NULL CHECK (reflection >= 5 AND reflection <= 25),
    total INTEGER NOT NULL CHECK (total >= 30 AND total <= 150),
    communication_zone TEXT NOT NULL,
    learning_zone TEXT NOT NULL,
    opportunities_zone TEXT NOT NULL,
    vulnerability_zone TEXT NOT NULL,
    enablement_zone TEXT NOT NULL,
    reflection_zone TEXT NOT NULL,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_assessments_email ON assessments(participant_email);
CREATE INDEX IF NOT EXISTS idx_assessments_status ON assessments(status);
CREATE INDEX IF NOT EXISTS idx_assessments_completed_at ON assessments(completed_at);
CREATE INDEX IF NOT EXISTS idx_assessment_responses_assessment_id ON assessment_responses(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_scores_assessment_id ON assessment_scores(assessment_id);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_assessments_updated_at ON assessments;
CREATE TRIGGER update_assessments_updated_at
    BEFORE UPDATE ON assessments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_assessment_responses_updated_at ON assessment_responses;
CREATE TRIGGER update_assessment_responses_updated_at
    BEFORE UPDATE ON assessment_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (optional but recommended)
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_scores ENABLE ROW LEVEL SECURITY;

-- Create policies for service role (full access)
DROP POLICY IF EXISTS "Service role has full access to assessments" ON assessments;
CREATE POLICY "Service role has full access to assessments" ON assessments
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role has full access to assessment_responses" ON assessment_responses;
CREATE POLICY "Service role has full access to assessment_responses" ON assessment_responses
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role has full access to assessment_scores" ON assessment_scores;
CREATE POLICY "Service role has full access to assessment_scores" ON assessment_scores
    FOR ALL USING (true) WITH CHECK (true);
