-- =============================================
-- Migration 038: People CRM Enhancement
-- =============================================
-- Expand person_notes for structured activity logging (calls, meetings, tasks)
-- and add attentiveness tracking to contacts.
-- =============================================

-- 1. Add structured fields to person_notes for activity logging
ALTER TABLE person_notes ADD COLUMN IF NOT EXISTS outcome TEXT;
ALTER TABLE person_notes ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE person_notes ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT false;
ALTER TABLE person_notes ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;

-- 2. Indexes for task/activity queries
CREATE INDEX IF NOT EXISTS idx_person_notes_due_date ON person_notes(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_person_notes_incomplete ON person_notes(completed) WHERE completed = false;

-- 3. Attentiveness tracking on contacts
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_activity_date TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_contacts_last_activity ON contacts(last_activity_date DESC);

-- 4. Backfill last_activity_date from updated_at
UPDATE contacts SET last_activity_date = updated_at WHERE last_activity_date IS NULL;

-- 5. VERIFY
SELECT
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'person_notes' AND column_name = 'outcome') as has_outcome,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'person_notes' AND column_name = 'due_date') as has_due_date,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'person_notes' AND column_name = 'completed') as has_completed,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'person_notes' AND column_name = 'duration_minutes') as has_duration,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'last_activity_date') as has_last_activity;
