-- =============================================
-- Migration 033: Link Turnover Reports to Outreach System
-- =============================================
-- Creates turnover_reports table in CRM database with ALL calculated fields.
-- Adds FK link from outreach_prospects to turnover_reports.
-- Enables the turnover analysis tool's report data to flow directly
-- into outreach email template variables.
-- =============================================

-- 1. CREATE turnover_reports TABLE (with ALL calculated fields)
CREATE TABLE IF NOT EXISTS turnover_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Basic info
    company_name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    email TEXT NOT NULL,
    industry TEXT NOT NULL,
    total_employees INTEGER NOT NULL,
    turnover_rate DECIMAL NOT NULL,

    -- Primary calculated values (used by email templates)
    annual_cost DECIMAL NOT NULL,
    daily_cost DECIMAL,
    cost_per_departure DECIMAL,
    annual_departures INTEGER,
    in_67_day_window INTEGER,

    -- Organization structure
    number_of_managers INTEGER,
    manager_ratio INTEGER,
    industry_average DECIMAL,

    -- Detailed breakdowns (JSONB for flexibility)
    cost_breakdown JSONB,
    savings_projections JSONB,

    -- Status tracking
    pdf_generated BOOLEAN DEFAULT FALSE,
    email_sent BOOLEAN DEFAULT FALSE,

    -- Link to outreach prospect (set on auto-match or manual link)
    prospect_id UUID REFERENCES outreach_prospects(id) ON DELETE SET NULL
);

-- 2. ADD turnover_report_id TO outreach_prospects
ALTER TABLE outreach_prospects
    ADD COLUMN IF NOT EXISTS turnover_report_id UUID;

-- Add FK constraint separately (IF NOT EXISTS not supported on constraints)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_outreach_prospects_turnover_report'
    ) THEN
        ALTER TABLE outreach_prospects
            ADD CONSTRAINT fk_outreach_prospects_turnover_report
            FOREIGN KEY (turnover_report_id) REFERENCES turnover_reports(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_turnover_reports_email ON turnover_reports(email);
CREATE INDEX IF NOT EXISTS idx_turnover_reports_company_name ON turnover_reports(company_name);
CREATE INDEX IF NOT EXISTS idx_turnover_reports_created_at ON turnover_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_outreach_prospects_turnover_report ON outreach_prospects(turnover_report_id);

-- 4. ROW LEVEL SECURITY
ALTER TABLE turnover_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous insert on turnover_reports"
    ON turnover_reports FOR INSERT TO anon
    WITH CHECK (true);

CREATE POLICY "Allow anonymous update on turnover_reports"
    ON turnover_reports FOR UPDATE TO anon
    USING (true) WITH CHECK (true);

CREATE POLICY "Allow anonymous select on turnover_reports"
    ON turnover_reports FOR SELECT TO anon
    USING (true);

CREATE POLICY "Allow authenticated full access on turnover_reports"
    ON turnover_reports FOR ALL TO authenticated
    USING (true) WITH CHECK (true);

GRANT INSERT, UPDATE, SELECT ON turnover_reports TO anon;
GRANT ALL ON turnover_reports TO authenticated;

-- 5. VERIFY
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'turnover_reports'
ORDER BY ordinal_position;

SELECT column_name FROM information_schema.columns
WHERE table_name = 'outreach_prospects' AND column_name = 'turnover_report_id';
