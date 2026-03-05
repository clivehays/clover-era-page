-- =============================================
-- Migration 039: Catch-up — Add all missing contacts columns
-- =============================================
-- Ensures all columns needed by the People page exist on contacts.
-- All use IF NOT EXISTS so safe to re-run.
-- =============================================

-- From migration 029 (may not have been run)
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS next_action TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS next_action_date DATE;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS traffic_source TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS linkedin_post_number TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS comment_text TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS team_size_estimated INTEGER;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS pain_points TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS objections TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS key_quotes TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS personal_notes TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS source TEXT;

-- From migration 034
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT;

-- From migration 038
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_activity_date TIMESTAMPTZ;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contacts_next_action_date ON contacts(next_action_date);
CREATE INDEX IF NOT EXISTS idx_contacts_lifecycle_stage ON contacts(lifecycle_stage);
CREATE INDEX IF NOT EXISTS idx_contacts_last_activity ON contacts(last_activity_date DESC);

-- person_notes table (from migration 034)
CREATE TABLE IF NOT EXISTS person_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    prospect_id UUID REFERENCES outreach_prospects(id) ON DELETE SET NULL,
    note_type TEXT NOT NULL DEFAULT 'note',
    content TEXT NOT NULL,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT person_notes_has_person CHECK (contact_id IS NOT NULL OR prospect_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_person_notes_contact ON person_notes(contact_id);
CREATE INDEX IF NOT EXISTS idx_person_notes_prospect ON person_notes(prospect_id);
CREATE INDEX IF NOT EXISTS idx_person_notes_created ON person_notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_person_notes_type ON person_notes(note_type);

-- person_notes extra columns (from migration 038)
ALTER TABLE person_notes ADD COLUMN IF NOT EXISTS outcome TEXT;
ALTER TABLE person_notes ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE person_notes ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT false;
ALTER TABLE person_notes ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;

CREATE INDEX IF NOT EXISTS idx_person_notes_due_date ON person_notes(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_person_notes_incomplete ON person_notes(completed) WHERE completed = false;

-- Backfill last_activity_date from updated_at
UPDATE contacts SET last_activity_date = updated_at WHERE last_activity_date IS NULL;

-- VERIFY
SELECT
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'next_action') as has_next_action,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'lifecycle_stage') as has_lifecycle_stage,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'last_activity_date') as has_last_activity,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'person_notes' AND column_name = 'outcome') as has_pn_outcome;
