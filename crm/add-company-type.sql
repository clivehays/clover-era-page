-- Add company_type field to distinguish customers from partners
-- Run this in Supabase SQL Editor

ALTER TABLE companies
ADD COLUMN IF NOT EXISTS company_type TEXT DEFAULT 'customer'
CHECK (company_type IN ('customer', 'partner', 'both'));

-- Add partner-specific fields
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS partner_commission_rate INTEGER,
ADD COLUMN IF NOT EXISTS partner_territory TEXT,
ADD COLUMN IF NOT EXISTS partner_agreement_date DATE,
ADD COLUMN IF NOT EXISTS partner_status TEXT CHECK (partner_status IN ('active', 'inactive', 'pending', NULL));

-- Add index for company type
CREATE INDEX IF NOT EXISTS idx_companies_company_type ON companies(company_type);

-- Update existing sample data
UPDATE companies
SET company_type = 'customer'
WHERE company_type IS NULL;

COMMENT ON COLUMN companies.company_type IS 'Type of company: customer (potential/existing customer), partner (reseller/channel partner), or both';
COMMENT ON COLUMN companies.partner_commission_rate IS 'Commission rate for partners (e.g., 25 for 25%)';
COMMENT ON COLUMN companies.partner_territory IS 'Geographic territory or vertical for partner';
COMMENT ON COLUMN companies.partner_status IS 'Partner program status';
