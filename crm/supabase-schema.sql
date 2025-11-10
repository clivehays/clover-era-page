-- Clover ERA CRM Database Schema
-- Copy and paste this into Supabase SQL Editor
-- Run all statements at once

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  website TEXT,
  employee_count INTEGER,
  industry TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'United States',
  status TEXT DEFAULT 'prospect' CHECK (status IN ('prospect', 'qualified', 'customer', 'churned', 'inactive')),
  annual_revenue INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contacts table
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  title TEXT,
  department TEXT,
  is_primary BOOLEAN DEFAULT false,
  linkedin_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Opportunities table
CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'lead' CHECK (stage IN ('lead', 'qualified', 'demo-scheduled', 'demo-completed', 'proposal', 'negotiation', 'pilot', 'closed-won', 'closed-lost')),
  value INTEGER, -- deal size in dollars (annual contract value)
  probability INTEGER DEFAULT 10 CHECK (probability >= 0 AND probability <= 100), -- 0-100
  expected_close_date DATE,
  actual_close_date DATE,
  managers_count INTEGER, -- number of manager licenses
  employees_covered INTEGER, -- total employees covered
  pilot_start_date DATE,
  pilot_end_date DATE,
  monthly_recurring_revenue INTEGER, -- MRR in dollars
  annual_contract_value INTEGER, -- ACV in dollars
  source TEXT CHECK (source IN ('partner', 'direct', 'referral', 'inbound', 'outbound', 'event', 'website')),
  partner_name TEXT, -- if source is partner
  lost_reason TEXT,
  competitor TEXT,
  next_step TEXT,
  notes TEXT,
  owner_id UUID, -- references auth.users
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activities table
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'demo', 'proposal-sent', 'contract-sent', 'note', 'task')),
  subject TEXT NOT NULL,
  description TEXT,
  outcome TEXT,
  completed BOOLEAN DEFAULT false,
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  created_by UUID, -- references auth.users
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table (for Clover ERA offerings)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price_per_manager INTEGER NOT NULL, -- $295 per manager per month
  billing_period TEXT DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'annual')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Opportunity products (many-to-many)
CREATE TABLE opportunity_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1, -- number of managers
  price INTEGER NOT NULL, -- price at time of quote
  discount_percent INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Files/Attachments table
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  storage_path TEXT NOT NULL, -- Supabase storage path
  uploaded_by UUID, -- references auth.users
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_companies_created_at ON companies(created_at DESC);
CREATE INDEX idx_contacts_company_id ON contacts(company_id);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_opportunities_stage ON opportunities(stage);
CREATE INDEX idx_opportunities_company_id ON opportunities(company_id);
CREATE INDEX idx_opportunities_owner_id ON opportunities(owner_id);
CREATE INDEX idx_opportunities_expected_close_date ON opportunities(expected_close_date);
CREATE INDEX idx_opportunities_created_at ON opportunities(created_at DESC);
CREATE INDEX idx_activities_opportunity_id ON activities(opportunity_id);
CREATE INDEX idx_activities_company_id ON activities(company_id);
CREATE INDEX idx_activities_due_date ON activities(due_date);
CREATE INDEX idx_activities_completed ON activities(completed);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to tables
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON opportunities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default product (Clover ERA Manager Enablement Platform)
INSERT INTO products (name, description, price_per_manager, billing_period) VALUES
('Clover ERA - Manager Enablement Platform', 'Per-manager monthly subscription including dashboard, CLOVER framework, 105+ worksheets, and predictive analytics', 295, 'monthly');

-- Sample data for testing (optional - remove if you want to start fresh)
-- Insert sample company
INSERT INTO companies (name, website, employee_count, industry, status) VALUES
('Acme Technology Corp', 'https://acmetech.example.com', 250, 'Technology', 'qualified');

-- Get the company ID for sample data
DO $$
DECLARE
    sample_company_id UUID;
    sample_contact_id UUID;
BEGIN
    -- Get sample company ID
    SELECT id INTO sample_company_id FROM companies WHERE name = 'Acme Technology Corp';

    -- Insert sample contact
    INSERT INTO contacts (company_id, first_name, last_name, email, phone, title, is_primary)
    VALUES (sample_company_id, 'Jane', 'Smith', 'jane.smith@acmetech.example.com', '(555) 123-4567', 'VP of Human Resources', true)
    RETURNING id INTO sample_contact_id;

    -- Insert sample opportunity
    INSERT INTO opportunities (
        company_id,
        contact_id,
        title,
        stage,
        value,
        probability,
        managers_count,
        monthly_recurring_revenue,
        annual_contract_value,
        source,
        next_step
    ) VALUES (
        sample_company_id,
        sample_contact_id,
        'Acme Technology - Manager Enablement Pilot',
        'demo-scheduled',
        35400, -- 10 managers x $295 x 12 months
        30,
        10,
        2950, -- 10 managers x $295
        35400,
        'inbound',
        'Schedule product demo for next week'
    );
END $$;

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- For now, allow authenticated users to read/write all data
-- Later you can add more granular policies based on user roles
CREATE POLICY "Allow authenticated users full access to companies"
    ON companies FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to contacts"
    ON contacts FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to opportunities"
    ON opportunities FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to activities"
    ON activities FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read products"
    ON products FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users full access to opportunity_products"
    ON opportunity_products FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to files"
    ON files FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create views for common queries
CREATE VIEW opportunity_pipeline AS
SELECT
    o.id,
    o.title,
    o.stage,
    o.value,
    o.probability,
    o.expected_close_date,
    o.managers_count,
    o.monthly_recurring_revenue,
    c.name as company_name,
    c.industry,
    con.first_name || ' ' || con.last_name as contact_name,
    con.email as contact_email,
    o.created_at,
    o.updated_at
FROM opportunities o
LEFT JOIN companies c ON o.company_id = c.id
LEFT JOIN contacts con ON o.contact_id = con.id
WHERE o.stage NOT IN ('closed-won', 'closed-lost')
ORDER BY o.expected_close_date ASC NULLS LAST;

-- Create view for won deals
CREATE VIEW won_opportunities AS
SELECT
    o.id,
    o.title,
    o.stage,
    o.value,
    o.actual_close_date,
    o.managers_count,
    o.monthly_recurring_revenue,
    o.annual_contract_value,
    c.name as company_name,
    c.employee_count,
    c.industry,
    o.created_at
FROM opportunities o
LEFT JOIN companies c ON o.company_id = c.id
WHERE o.stage = 'closed-won'
ORDER BY o.actual_close_date DESC;
