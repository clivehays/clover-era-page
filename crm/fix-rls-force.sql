-- Try using FORCE ROW LEVEL SECURITY which affects all roles including table owner

-- Disable FORCE RLS (use normal RLS)
ALTER TABLE roundtable_applications NO FORCE ROW LEVEL SECURITY;

-- Make sure regular RLS is enabled
ALTER TABLE roundtable_applications ENABLE ROW LEVEL SECURITY;

-- Check current RLS settings
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE
    WHEN rowsecurity = true THEN 'RLS Enabled'
    ELSE 'RLS Disabled'
  END as status
FROM pg_tables
WHERE tablename = 'roundtable_applications';

-- Also check pg_class for more details
SELECT
  relname,
  relrowsecurity,
  relforcerowsecurity
FROM pg_class
WHERE relname = 'roundtable_applications';
