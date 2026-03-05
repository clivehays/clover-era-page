-- =============================================
-- Migration 034: People System - Notes & Lifecycle
-- =============================================
-- Creates person_notes table for unified timeline.
-- Adds lifecycle_stage to contacts for manual override.
-- =============================================

-- 1. CREATE person_notes TABLE
CREATE TABLE IF NOT EXISTS person_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    prospect_id UUID REFERENCES outreach_prospects(id) ON DELETE SET NULL,
    note_type TEXT NOT NULL DEFAULT 'note',
    content TEXT NOT NULL,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- At least one FK must be set
    CONSTRAINT person_notes_has_person CHECK (contact_id IS NOT NULL OR prospect_id IS NOT NULL)
);

-- 2. INDEXES
CREATE INDEX IF NOT EXISTS idx_person_notes_contact ON person_notes(contact_id);
CREATE INDEX IF NOT EXISTS idx_person_notes_prospect ON person_notes(prospect_id);
CREATE INDEX IF NOT EXISTS idx_person_notes_created ON person_notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_person_notes_type ON person_notes(note_type);

-- 3. ADD lifecycle_stage TO contacts
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT;

-- 4. ROW LEVEL SECURITY
ALTER TABLE person_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous insert on person_notes"
    ON person_notes FOR INSERT TO anon
    WITH CHECK (true);

CREATE POLICY "Allow anonymous update on person_notes"
    ON person_notes FOR UPDATE TO anon
    USING (true) WITH CHECK (true);

CREATE POLICY "Allow anonymous select on person_notes"
    ON person_notes FOR SELECT TO anon
    USING (true);

CREATE POLICY "Allow anonymous delete on person_notes"
    ON person_notes FOR DELETE TO anon
    USING (true);

CREATE POLICY "Allow authenticated full access on person_notes"
    ON person_notes FOR ALL TO authenticated
    USING (true) WITH CHECK (true);

GRANT INSERT, UPDATE, SELECT, DELETE ON person_notes TO anon;
GRANT ALL ON person_notes TO authenticated;

-- 5. VERIFY
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'person_notes'
ORDER BY ordinal_position;

SELECT column_name FROM information_schema.columns
WHERE table_name = 'contacts' AND column_name = 'lifecycle_stage';
