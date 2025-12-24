-- Create turnover_reports table for lead capture
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS turnover_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    company_name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    email TEXT NOT NULL,
    industry TEXT NOT NULL,
    total_employees INTEGER NOT NULL,
    turnover_rate DECIMAL NOT NULL,
    annual_cost DECIMAL NOT NULL,
    pdf_generated BOOLEAN DEFAULT FALSE,
    email_sent BOOLEAN DEFAULT FALSE
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_turnover_reports_email ON turnover_reports(email);

-- Create index on created_at for chronological queries
CREATE INDEX IF NOT EXISTS idx_turnover_reports_created_at ON turnover_reports(created_at DESC);

-- Enable Row Level Security
ALTER TABLE turnover_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Allow inserts from anonymous users (for lead capture)
CREATE POLICY "Allow anonymous insert" ON turnover_reports
    FOR INSERT
    WITH CHECK (true);

-- Policy: Allow updates from anonymous users (for PDF/email status updates)
CREATE POLICY "Allow anonymous update" ON turnover_reports
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Policy: Only allow authenticated users to read data (for admin access)
CREATE POLICY "Allow authenticated read" ON turnover_reports
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Grant permissions to anon role
GRANT INSERT, UPDATE ON turnover_reports TO anon;
GRANT SELECT ON turnover_reports TO authenticated;
