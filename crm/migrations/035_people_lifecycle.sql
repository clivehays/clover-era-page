-- =============================================
-- Migration 035: People Lifecycle Enhancements
-- =============================================
-- Adds missing columns to outreach_prospects for people.html queries.
-- Adds indexes for Command Center people-centric queries.
-- =============================================

-- 1. Add source column to outreach_prospects
ALTER TABLE outreach_prospects ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'outbound';

-- 2. Add updated_at column to outreach_prospects
ALTER TABLE outreach_prospects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Backfill updated_at from created_at
UPDATE outreach_prospects SET updated_at = created_at WHERE updated_at IS NULL;

-- 4. Indexes for people-centric queries
CREATE INDEX IF NOT EXISTS idx_contacts_next_action_date ON contacts(next_action_date);
CREATE INDEX IF NOT EXISTS idx_contacts_lifecycle_stage ON contacts(lifecycle_stage);
CREATE INDEX IF NOT EXISTS idx_outreach_prospects_updated ON outreach_prospects(updated_at DESC);

-- 5. VERIFY
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'outreach_prospects' AND column_name IN ('source', 'updated_at')
ORDER BY column_name;
