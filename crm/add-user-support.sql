-- Add user support for multi-user CRM
-- Run this in Supabase SQL Editor

-- Add owner_id to opportunities table
ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);

-- Add owner_id to activities table
ALTER TABLE activities
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);

-- Add owner_id to companies table (optional - who created/owns the company record)
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_opportunities_owner ON opportunities(owner_id);
CREATE INDEX IF NOT EXISTS idx_activities_owner ON activities(owner_id);
CREATE INDEX IF NOT EXISTS idx_companies_owner ON companies(owner_id);

-- Create a profiles table to store user metadata
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    role TEXT CHECK (role IN ('admin', 'sales_rep', 'manager')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all profiles (to see team members)
CREATE POLICY "Profiles are viewable by authenticated users"
    ON profiles FOR SELECT
    TO authenticated
    USING (true);

-- Profiles: Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- Create a function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 'sales_rep');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call the function on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update existing records to set owner_id to the current user
-- This will need to be run by an admin after deployment
UPDATE opportunities SET owner_id = (SELECT id FROM auth.users LIMIT 1) WHERE owner_id IS NULL;
UPDATE activities SET owner_id = (SELECT id FROM auth.users LIMIT 1) WHERE owner_id IS NULL;
UPDATE companies SET owner_id = (SELECT id FROM auth.users LIMIT 1) WHERE owner_id IS NULL;

-- Create profiles for existing users
INSERT INTO profiles (id, email, role)
SELECT id, email, 'sales_rep'
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

COMMENT ON COLUMN opportunities.owner_id IS 'User who owns/is responsible for this opportunity';
COMMENT ON COLUMN activities.owner_id IS 'User who created this activity';
COMMENT ON COLUMN companies.owner_id IS 'User who created this company record';
COMMENT ON TABLE profiles IS 'User profiles with role and metadata';
