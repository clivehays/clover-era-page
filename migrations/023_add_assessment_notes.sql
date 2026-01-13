-- Migration 023: Add notes fields to assessment_responses table
-- Run this in Supabase SQL Editor

-- Add a notes table for free-text responses per section
CREATE TABLE IF NOT EXISTS assessment_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    section_id TEXT NOT NULL CHECK (section_id IN ('communication', 'learning', 'opportunities', 'vulnerability', 'enablement', 'reflection')),
    note_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(assessment_id, section_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_assessment_notes_assessment_id ON assessment_notes(assessment_id);

-- Enable Row Level Security
ALTER TABLE assessment_notes ENABLE ROW LEVEL SECURITY;

-- Create policy for service role (full access)
DROP POLICY IF EXISTS "Service role has full access to assessment_notes" ON assessment_notes;
CREATE POLICY "Service role has full access to assessment_notes" ON assessment_notes
    FOR ALL USING (true) WITH CHECK (true);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_assessment_notes_updated_at ON assessment_notes;
CREATE TRIGGER update_assessment_notes_updated_at
    BEFORE UPDATE ON assessment_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
